import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGService } from '../../services/rag.service.js';
import type { IEmbeddingService, IKnowledgeRepository } from '../../domain/interfaces/index.js';

vi.mock('../../infrastructure/cache/cache.service.js', () => ({
  CacheService: class {
    get = vi.fn();
    set = vi.fn();
    del = vi.fn();
    clear = vi.fn();
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
});
