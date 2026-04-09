import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGService } from '../../services/rag.service.js';
import type { IEmbeddingService, IKnowledgeRepository } from '../../domain/interfaces/index.js';

// Mock CacheService
vi.mock('../../infrastructure/cache/cache.service.js', () => {
  return {
    CacheService: class {
      get = vi.fn();
      set = vi.fn();
      del = vi.fn();
      clear = vi.fn();
    }
  };
});

describe('RAGService', () => {
  let service: RAGService;
  let mockEmbeddingService: IEmbeddingService;
  let mockKnowledgeRepository: IKnowledgeRepository;

  beforeEach(() => {
    mockEmbeddingService = {
      getEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    };

    mockKnowledgeRepository = {
      matchKnowledge: vi.fn().mockResolvedValue([
        {
          id: '1',
          title: 'Doc 1',
          content: 'Content 1',
          category: 'servicios',
          similarity: 0.9,
        },
      ]),
    };

    service = new RAGService(mockEmbeddingService, mockKnowledgeRepository);
    
    // Default mock behavior for CacheService instance
    const cacheInstance = (service as any).cacheService;
    cacheInstance.get.mockResolvedValue(null);
    cacheInstance.set.mockResolvedValue(undefined);

    vi.clearAllMocks();
  });

  it('should retrieve RAG context successfully', async () => {
    const result = await service.retrieveContext('¿Qué servicios?');

    expect(result.sources).toHaveLength(1);
    expect(result.context).toContain('CONTEXTO RECUPERADO');
    expect(mockEmbeddingService.getEmbedding).toHaveBeenCalled();
  });

  it('should handle embedding failure gracefully', async () => {
    vi.mocked(mockEmbeddingService.getEmbedding).mockRejectedValueOnce(
      new Error('Embedding failed')
    );

    const result = await service.retrieveContext('test');

    expect(result.context).toBe('');
    expect(result.sources).toEqual([]);
  });

  it('should return empty sources when no matches', async () => {
    vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([]);

    const result = await service.retrieveContext('test');

    expect(result.sources).toEqual([]);
    expect(result.context).toBe('');
  });
});
