import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('../../../config/supabase.config.js', () => ({
  supabaseClient: { rpc: mocks.mockRpc, from: vi.fn() },
}));

import { KnowledgeRepository } from '../../../infrastructure/repositories/knowledge.repository.js';

// --- Fixtures -----------------------------------------------------------------

const SAMPLE_EMBEDDING = [0.1, 0.2, 0.3];

const DB_ROWS = [
  { id: 1, category: 'horario', title: 'Horarios', content: '8am-4pm', similarity: 0.85 },
  { id: 2, category: 'servicio', title: 'Koha', content: 'Sistema bibliotecario', similarity: 0.72 },
];

// --- Suite --------------------------------------------------------------------

describe('KnowledgeRepository', () => {
  let repo: KnowledgeRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new KnowledgeRepository();
  });

  describe('matchKnowledge — successful retrieval', () => {
    it('should map all DB row fields to KnowledgeMatch domain objects', async () => {
      // Arrange
      mocks.mockRpc.mockResolvedValueOnce({ data: DB_ROWS, error: null });

      // Act
      const results = await repo.matchKnowledge(SAMPLE_EMBEDDING);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 1,
        category: 'horario',
        title: 'Horarios',
        content: '8am-4pm',
        similarity: 0.85,
      });
    });

    it('should call the "match_knowledge" RPC with correctly serialized embedding and explicit params', async () => {
      // Arrange
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      // Act
      await repo.matchKnowledge(SAMPLE_EMBEDDING, 10, 0.5);

      // Assert
      expect(mocks.mockRpc).toHaveBeenCalledWith('match_knowledge', {
        query_embedding: '[0.1,0.2,0.3]',
        match_count: 10,
        match_threshold: 0.5,
      });
    });

    it('should apply default matchCount=5 and matchThreshold=0.65 when no params are provided', async () => {
      // Arrange
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      // Act
      await repo.matchKnowledge(SAMPLE_EMBEDDING);

      // Assert
      expect(mocks.mockRpc).toHaveBeenCalledWith('match_knowledge', {
        query_embedding: '[0.1,0.2,0.3]',
        match_count: 5,
        match_threshold: 0.65,
      });
    });

    it('should map the category field correctly for all result items', async () => {
      // Arrange
      mocks.mockRpc.mockResolvedValueOnce({
        data: [{ id: 42, category: 'tramite', title: 'Certificado', content: 'Solicitar en ventanilla', similarity: 0.95 }],
        error: null,
      });

      // Act
      const results = await repo.matchKnowledge(SAMPLE_EMBEDDING);

      // Assert — category is a domain-critical field that must survive the mapping
      expect(results[0]).toEqual({
        id: 42,
        category: 'tramite',
        title: 'Certificado',
        content: 'Solicitar en ventanilla',
        similarity: 0.95,
      });
    });
  });

  describe('matchKnowledge — empty / null results', () => {
    it('should return an empty array when the RPC returns no matches', async () => {
      // Arrange
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      // Act
      const results = await repo.matchKnowledge(SAMPLE_EMBEDDING);

      // Assert
      expect(results).toEqual([]);
    });

    it('should return an empty array when the RPC returns null data', async () => {
      // Arrange
      mocks.mockRpc.mockResolvedValueOnce({ data: null, error: null });

      // Act
      const results = await repo.matchKnowledge(SAMPLE_EMBEDDING);

      // Assert
      expect(results).toEqual([]);
    });
  });

  describe('matchKnowledge — edge case embeddings', () => {
    it('should serialize an empty embedding array as "[]"', async () => {
      // Arrange
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      // Act
      await repo.matchKnowledge([]);

      // Assert
      expect(mocks.mockRpc).toHaveBeenCalledWith('match_knowledge',
        expect.objectContaining({ query_embedding: '[]' })
      );
    });

    it('should serialize a single-element embedding correctly', async () => {
      // Arrange
      mocks.mockRpc.mockResolvedValueOnce({ data: [], error: null });

      // Act
      await repo.matchKnowledge([0.5]);

      // Assert
      expect(mocks.mockRpc).toHaveBeenCalledWith('match_knowledge',
        expect.objectContaining({ query_embedding: '[0.5]' })
      );
    });
  });

  describe('matchKnowledge — error handling', () => {
    it('should throw the raw Supabase error when the RPC call fails', async () => {
      // Arrange
      const supabaseError = { message: 'Function not found', code: '42883' };
      mocks.mockRpc.mockResolvedValueOnce({ data: null, error: supabaseError });

      // Act & Assert
      await expect(repo.matchKnowledge(SAMPLE_EMBEDDING)).rejects.toEqual(supabaseError);
    });
  });
});
