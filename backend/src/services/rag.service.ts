import type { IEmbeddingService, IKnowledgeRepository } from '../domain/interfaces/index.js';
import type { KnowledgeMatch } from '../domain/interfaces/index.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import { CacheService } from '../infrastructure/cache/cache.service.js';
import { EmbeddingService } from './embedding.service.js';

export interface RagRetrievalResult {
  context: string;
  sources: KnowledgeMatch[];
  maxSimilarity: number;
  hit: boolean; // true if results meet minimum quality threshold
}

export class RAGService {
  readonly cacheService = new CacheService();
  private static readonly CACHE_KEY_PREFIX = 'rag:';
  // Include model name in key — if model changes, old cached embeddings are ignored automatically
  private static readonly EMBEDDING_KEY_PREFIX = `embedding:${EmbeddingService.MODEL}:`;
  private static readonly CACHE_TTL = 3600; // 1 hour

  // MINIMUM quality threshold — below this, results are considered noise (fail-hard)
  private static readonly MIN_VALID_THRESHOLD = 0.65;

  constructor(
    private embeddingService: IEmbeddingService,
    private knowledgeRepository: IKnowledgeRepository
  ) { }

  async retrieveContext(
    userMessage: string,
    options?: { matchCount?: number; threshold?: number },
    requestId?: string
  ): Promise<RagRetrievalResult> {
    const logger = contextLogger(requestId);
    const startTime = Date.now();

    try {
      const cacheKey = `${RAGService.CACHE_KEY_PREFIX}${userMessage}`;
      const cached = await this.cacheService.get<{ context: string; sources: KnowledgeMatch[]; maxSimilarity: number }>(cacheKey, requestId);

      if (cached) {
        logger.debug('RAG context retrieved from cache', { cacheKey });
        return {
          ...cached,
          hit: cached.maxSimilarity >= RAGService.MIN_VALID_THRESHOLD,
        };
      }

      // Try caching just the embedding too (longer TTL)
      const embeddingCacheKey = `${RAGService.EMBEDDING_KEY_PREFIX}${userMessage}`;
      let embedding = await this.cacheService.get<number[]>(embeddingCacheKey, requestId);

      if (!embedding) {
        logger.debug('Generating new embedding');
        embedding = await this.embeddingService.getEmbedding(userMessage, requestId);
        // Cache embedding for 24 hours
        await this.cacheService.set(embeddingCacheKey, embedding, 86400, requestId);
      } else {
        logger.debug('Embedding retrieved from cache', { embeddingCacheKey });
      }

      // Use the HIGHER of: caller's threshold OR our minimum valid threshold
      const effectiveThreshold = Math.max(
        options?.threshold ?? 0.4,
        RAGService.MIN_VALID_THRESHOLD
      );

      const sources = await this.knowledgeRepository.matchKnowledge(
        embedding,
        options?.matchCount ?? 5,
        effectiveThreshold,
        requestId
      );

      // Compute max similarity for observability
      const maxSimilarity = sources.length > 0
        ? Math.max(...sources.map((s) => s.similarity))
        : 0;

      // FAIL-HARD: If max similarity doesn't meet minimum threshold, reject all results
      if (maxSimilarity < RAGService.MIN_VALID_THRESHOLD) {
        logger.info('RAG fail-hard: max similarity below minimum threshold', {
          maxSimilarity,
          minThreshold: RAGService.MIN_VALID_THRESHOLD,
          sourceCountBeforeReject: sources.length,
        });

        const result: RagRetrievalResult = { context: '', sources: [], maxSimilarity, hit: false };
        return result;
      }

      const context =
        '\n\n== CONTEXTO RECUPERADO DE LA BASE DE CONOCIMIENTOS ==\n' +
        sources.map((r, i) => `[${i + 1}] ${r.title ? `**${r.title}**\n` : ''}${r.content}`).join('\n\n') +
        '\n\nUtiliza este contexto para responder con precisión si es relevante.';

      const result: RagRetrievalResult = { context, sources, maxSimilarity, hit: true };

      // Cache full RAG result (only when it's a hit)
      await this.cacheService.set(cacheKey, { context, sources, maxSimilarity }, RAGService.CACHE_TTL, requestId);

      const duration = Date.now() - startTime;
      logger.info('RAG retrieval completed', {
        duration,
        sourceCount: sources.length,
        maxSimilarity,
        hit: true,
        cached: false,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('RAG retrieval failed', { error, duration });
      return { context: '', sources: [], maxSimilarity: 0, hit: false };
    }
  }
}
