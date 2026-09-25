import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGService, RAG_CONTEXT_CACHE_PREFIX } from '../../services/rag.service.js';
import type { IEmbeddingService, IKnowledgeRepository, KnowledgeMatch } from '../../domain/interfaces/index.js';

vi.mock('../../infrastructure/cache/cache.service.js', () => ({
  CacheService: class {
    get = vi.fn();
    set = vi.fn();
    del = vi.fn();
    clear = vi.fn();
    deleteByPrefix = vi.fn();
  },
}));

// --- Fixtures -----------------------------------------------------------------

const SAMPLE_EMBEDDING = [0.1, 0.2, 0.3];
const SAMPLE_MATCH = {
  id: '1',
  title: 'Doc 1',
  content: 'Content 1',
  category: 'servicios',
  similarity: 0.9,
};

// --- Suite --------------------------------------------------------------------

describe('RAGService', () => {
  let service: RAGService;
  let mockEmbeddingService: IEmbeddingService;
  let mockKnowledgeRepository: IKnowledgeRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEmbeddingService = {
      getEmbedding: vi.fn().mockResolvedValue(SAMPLE_EMBEDDING),
    };

    mockKnowledgeRepository = {
      matchKnowledge: vi.fn().mockResolvedValue([SAMPLE_MATCH]),
    };

    service = new RAGService(mockEmbeddingService, mockKnowledgeRepository);
  });

  describe('retrieveContext — successful retrieval', () => {
    it('should return sources and formatted context block when matches are found', async () => {
      // Arrange
      const query = 'Que servicios?';

      // Act
      const result = await service.retrieveContext(query);

      // Assert
      expect(result.sources).toHaveLength(1);
      expect(result.context).toMatch(/== CONTEXTO RECUPERADO/);
      expect(mockEmbeddingService.getEmbedding).toHaveBeenCalled();
    });
  });

  describe('retrieveContext — embedding failure', () => {
    it('should return empty context and sources when embedding service throws', async () => {
      // Arrange
      vi.mocked(mockEmbeddingService.getEmbedding).mockRejectedValueOnce(
        new Error('Embedding failed')
      );

      // Act
      const result = await service.retrieveContext('test');

      // Assert
      expect(result.context).toBe('');
      expect(result.sources).toEqual([]);
    });
  });

  describe('retrieveContext — no matches', () => {
    it('should return empty context and sources when repository returns no matches', async () => {
      // Arrange
      vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([]);

      // Act
      const result = await service.retrieveContext('test');

      // Assert
      expect(result.sources).toEqual([]);
      expect(result.context).toBe('');
    });
  });

  describe('retrieveContext — cache key (RAG-07)', () => {
    const ragKeysWritten = () =>
      vi.mocked(service.cacheService.set).mock.calls
        .map(([key]) => key as string)
        .filter((key) => key.startsWith(RAG_CONTEXT_CACHE_PREFIX));

    it.each([
      ['matchCount', { matchCount: 5 }, { matchCount: 3 }],
      ['threshold', { threshold: 0.7 }, { threshold: 0.8 }],
    ])('should cache the same message under different keys when %s differs', async (_param, first, second) => {
      await service.retrieveContext('Que servicios?', first);
      await service.retrieveContext('Que servicios?', second);

      const keys = ragKeysWritten();
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
    });

    it('should keep every RAG context key under the prefix that ingestion invalidates', async () => {
      await service.retrieveContext('Que servicios?');

      expect(ragKeysWritten()).toHaveLength(1);
    });
  });

  describe('retrieveContext — fail-hard by similarity threshold (RAG-11)', () => {
    const MIN_VALID_THRESHOLD = 0.65;

    const matchWith = (similarity: number, id = '1'): KnowledgeMatch => ({
      id,
      category: 'servicio',
      title: `Doc ${id}`,
      content: `Content ${id}`,
      similarity,
    });

    it('should reject every source when the best similarity is below the minimum, even if the repository returns matches', async () => {
      vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([matchWith(0.64), matchWith(0.5, '2')]);

      const result = await service.retrieveContext('Que servicios?');

      expect(result).toEqual({ context: '', sources: [], maxSimilarity: 0.64, hit: false });
    });

    it('should not cache a fail-hard result', async () => {
      vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([matchWith(0.64)]);

      await service.retrieveContext('Que servicios?');

      const ragWrites = vi.mocked(service.cacheService.set).mock.calls
        .filter(([key]) => (key as string).startsWith(RAG_CONTEXT_CACHE_PREFIX));
      expect(ragWrites).toHaveLength(0);
    });

    it('should accept the sources when the best similarity is exactly the minimum', async () => {
      vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([matchWith(MIN_VALID_THRESHOLD)]);

      const result = await service.retrieveContext('Que servicios?');

      expect(result.hit).toBe(true);
      expect(result.sources).toHaveLength(1);
    });

    it('should never ask the repository for a threshold below the minimum', async () => {
      await service.retrieveContext('Que servicios?', { threshold: 0.3 });

      expect(mockKnowledgeRepository.matchKnowledge).toHaveBeenCalledWith(SAMPLE_EMBEDDING, 5, MIN_VALID_THRESHOLD, undefined);
    });
  });
});
