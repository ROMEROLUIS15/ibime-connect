import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('../../../config/supabase.config.js', () => ({
  supabaseClient: { rpc: mocks.mockRpc, from: vi.fn() },
}));

import { KnowledgeRepository } from '../../../infrastructure/repositories/knowledge.repository.js';

describe('KnowledgeRepository', () => {
  let repo: KnowledgeRepository;

  const SAMPLE_EMBEDDING = [0.1, 0.2, 0.3];
  const SAMPLE_RPC_RESULT = [
    { id: 1, category: 'horario', title: 'Horarios', content: '8am-4pm', similarity: 0.85 },
    { id: 2, category: 'servicio', title: 'Koha', content: 'Sistema bibliotecario', similarity: 0.72 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new KnowledgeRepository();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('matchKnowledge', () => {
    it('should return mapped KnowledgeMatch results', async () => {
      mocks.mockRpc.mockResolvedValueOnce({ data: SAMPLE_RPC_RESULT, error: null });

      const results = await repo.matchKnowledge(SAMPLE_EMBEDDING);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 1,
        category: 'horario',
        title: 'Horarios',
        content: '8am-4pm',
        similarity: 0.85,
      });
    });

    it('should call RPC with correct parameters', async () => {
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await repo.matchKnowledge(SAMPLE_EMBEDDING, 10, 0.5);

      expect(mocks.mockRpc).toHaveBeenCalledWith('match_knowledge', {
        query_embedding: '[0.1,0.2,0.3]',
        match_count: 10,
        match_threshold: 0.5,
      });
    });

    it('should use default matchCount and matchThreshold', async () => {
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await repo.matchKnowledge(SAMPLE_EMBEDDING);

      expect(mocks.mockRpc).toHaveBeenCalledWith('match_knowledge', {
        query_embedding: '[0.1,0.2,0.3]',
        match_count: 5,
        match_threshold: 0.4,
      });
    });

    it('should return empty array when no matches found', async () => {
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      const results = await repo.matchKnowledge(SAMPLE_EMBEDDING);

      expect(results).toEqual([]);
    });

    it('should return empty array when RPC returns null data', async () => {
      mocks.mockRpc.mockResolvedValueOnce({ data: null, error: null });

      const results = await repo.matchKnowledge(SAMPLE_EMBEDDING);

      expect(results).toEqual([]);
    });

    it('should throw on RPC error', async () => {
      const supabaseError = { message: 'Function not found', code: '42883' };
      mocks.mockRpc.mockResolvedValueOnce({ data: null, error: supabaseError });

      await expect(repo.matchKnowledge(SAMPLE_EMBEDDING)).rejects.toEqual(supabaseError);
    });

    it('should handle empty embedding array', async () => {
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await repo.matchKnowledge([]);

      expect(mocks.mockRpc).toHaveBeenCalledWith('match_knowledge', {
        query_embedding: '[]',
        match_count: 5,
        match_threshold: 0.4,
      });
    });

    it('should handle single-dimension embedding', async () => {
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await repo.matchKnowledge([0.5]);

      expect(mocks.mockRpc).toHaveBeenCalledWith('match_knowledge', {
        query_embedding: '[0.5]',
        match_count: 5,
        match_threshold: 0.4,
      });
    });

    it('should map all fields correctly including category', async () => {
      mocks.mockRpc.mockResolvedValueOnce({
        data: [{
          id: 42,
          category: 'tramite',
          title: 'Certificado',
          content: 'Solicitar en ventanilla',
          similarity: 0.95,
        }],
        error: null,
      });

      const results = await repo.matchKnowledge(SAMPLE_EMBEDDING);

      expect(results[0]).toEqual({
        id: 42,
        category: 'tramite',
        title: 'Certificado',
        content: 'Solicitar en ventanilla',
        similarity: 0.95,
      });
    });
  });
});
