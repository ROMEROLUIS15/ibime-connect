import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  selectResult: { data: [] as any[], error: null as any },
  insertResult: { error: null as any },
  updateResult: { error: null as any },
  insertSpy: vi.fn(),
  updateSpy: vi.fn(),
  getEmbedding: vi.fn(),
}));

vi.mock('../../config/supabase.config.js', () => ({
  supabaseClient: {
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => Promise.resolve(mocks.selectResult),
        }),
      }),
      insert: (payload: any) => {
        mocks.insertSpy(payload);
        return Promise.resolve(mocks.insertResult);
      },
      update: (payload: any) => {
        mocks.updateSpy(payload);
        return { eq: () => Promise.resolve(mocks.updateResult) };
      },
    }),
  },
}));

vi.mock('../../services/embedding.service.js', () => ({
  EmbeddingService: class {
    getEmbedding = mocks.getEmbedding;
  },
}));

import { KnowledgeIngestionService } from '../../services/knowledge-ingestion.service.js';

// --- Constants ----------------------------------------------------------------

/** SHA-256 hash of the canonical content string for { biblionumber: '1', titulo: 'Cien anios de soledad' } */
const SAMPLE_CONTENT_HASH = 'edb654d954e7efa6150b6f8daaddca1665013e23995c5cda3469c8a531851e84';

const BOOK_ITEM = { biblionumber: '1', titulo: 'Cien anios de soledad' };

// --- Suite --------------------------------------------------------------------

describe('KnowledgeIngestionService.upsertKohaItems', () => {
  let service: KnowledgeIngestionService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset shared mock state before each test for full isolation
    mocks.selectResult = { data: [], error: null };
    mocks.insertResult = { error: null };
    mocks.updateResult = { error: null };
    mocks.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

    service = new KnowledgeIngestionService();
  });

  it('should INSERT a new item and generate its embedding when the item does not exist in the DB', async () => {
    // Arrange — selectResult already empty from beforeEach

    // Act
    const result = await service.upsertKohaItems([BOOK_ITEM]);

    // Assert
    expect(result).toEqual({ inserted: 1, updated: 0, skipped: 0, errors: 0 });
    expect(mocks.getEmbedding).toHaveBeenCalledTimes(1);
    expect(mocks.insertSpy).toHaveBeenCalledTimes(1);
    expect(mocks.updateSpy).not.toHaveBeenCalled();
  });

  it('should SKIP an existing item and skip embedding when the content hash is unchanged', async () => {
    // Arrange — simulate item already in DB with the same hash
    mocks.selectResult = {
      data: [{ id: 5, metadata: { koha_id: '1', content_hash: SAMPLE_CONTENT_HASH } }],
      error: null,
    };

    // Act
    const result = await service.upsertKohaItems([BOOK_ITEM]);

    // Assert
    expect(result).toEqual({ inserted: 0, updated: 0, skipped: 1, errors: 0 });
    expect(mocks.getEmbedding).not.toHaveBeenCalled();
    expect(mocks.insertSpy).not.toHaveBeenCalled();
    expect(mocks.updateSpy).not.toHaveBeenCalled();
  });

  it('should UPDATE an existing item and re-generate embedding when content has changed', async () => {
    // Arrange — simulate item in DB with a stale hash
    mocks.selectResult = {
      data: [{ id: 5, metadata: { koha_id: '1', content_hash: 'stale-hash' } }],
      error: null,
    };

    // Act
    const result = await service.upsertKohaItems([{ biblionumber: '1', titulo: 'Titulo actualizado' }]);

    // Assert
    expect(result).toEqual({ inserted: 0, updated: 1, skipped: 0, errors: 0 });
    expect(mocks.getEmbedding).toHaveBeenCalledTimes(1);
    expect(mocks.updateSpy).toHaveBeenCalledTimes(1);
    expect(mocks.insertSpy).not.toHaveBeenCalled();
  });

  it('should count errors without aborting the batch when the DB lookup fails', async () => {
    // Arrange — simulate a DB error on the select query
    mocks.selectResult = { data: [], error: { message: 'DB caida' } };

    // Act
    const result = await service.upsertKohaItems([
      { biblionumber: '1' },
      { biblionumber: '2' },
    ]);

    // Assert — both items fail, batch completes without throwing
    expect(result.errors).toBe(2);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);
  });
});

