import type { IEmbeddingService, IKnowledgeRepository } from '../domain/interfaces/index.js';
import type { KnowledgeMatch } from '../domain/interfaces/index.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import { CacheService } from '../infrastructure/cache/cache.service.js';
import { EmbeddingService } from './embedding.service.js';

export class RAGService {
  readonly cacheService = new CacheService();
  private static readonly CACHE_KEY_PREFIX = 'rag:';
  // Include model name in key — if model changes, old cached embeddings are ignored automatically
  private static readonly EMBEDDING_KEY_PREFIX = `embedding:${EmbeddingService.MODEL}:`;
  private static readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private embeddingService: IEmbeddingService,
    private knowledgeRepository: IKnowledgeRepository
  ) {}

  async retrieveContext(
    userMessage: string,
    options?: { matchCount?: number; threshold?: number },
    requestId?: string
  ): Promise<{ context: string; sources: KnowledgeMatch[] }> {
    const logger = contextLogger(requestId);
    const startTime = Date.now();

    try {
      const cacheKey = `${RAGService.CACHE_KEY_PREFIX}${userMessage}`;
      const cached = await this.cacheService.get<{ context: string; sources: KnowledgeMatch[] }>(cacheKey, requestId);
      
      if (cached) {
        logger.debug('RAG context retrieved from cache', { cacheKey });
        return cached;
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

      const sources = await this.knowledgeRepository.matchKnowledge(
        embedding,
        options?.matchCount ?? 5,
        options?.threshold ?? 0.4,
        requestId
      );

      const context =
        sources.length > 0
          ? '\n\n== CONTEXTO RECUPERADO DE LA BASE DE CONOCIMIENTOS ==\n' +
            sources.map((r, i) => `[${i + 1}] ${r.title ? `**${r.title}**\n` : ''}${r.content}`).join('\n\n') +
            '\n\nUtiliza este contexto para responder con precisión si es relevante.'
          : '';

      const result = { context, sources };

      // Cache full RAG result
      await this.cacheService.set(cacheKey, result, RAGService.CACHE_TTL, requestId);

      const duration = Date.now() - startTime;
      logger.info('RAG retrieval completed', { duration, sourceCount: sources.length, cached: false });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('RAG retrieval failed', { error, duration });
      return { context: '', sources: [] };
    }
  }
}
