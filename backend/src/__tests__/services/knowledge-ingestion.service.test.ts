import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

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

// Reconstruye el hash de contenido igual que el servicio, para el caso "sin cambios".
function contentHashOf(item: Record<string, unknown>): string {
  const content =
    '[Catálogo Koha]\n' +
    Object.entries(item)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  return createHash('sha256').update(content).digest('hex');
}

describe('KnowledgeIngestionService.upsertKohaItems', () => {
  let service: KnowledgeIngestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectResult = { data: [], error: null };
    mocks.insertResult = { error: null };
    mocks.updateResult = { error: null };
    mocks.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    service = new KnowledgeIngestionService();
  });

  it('inserta un ítem nuevo (no existe en la DB)', async () => {
    mocks.selectResult = { data: [], error: null };

    const result = await service.upsertKohaItems([{ biblionumber: '1', titulo: 'Cien años de soledad' }]);

    expect(result).toEqual({ inserted: 1, updated: 0, skipped: 0, errors: 0 });
    expect(mocks.getEmbedding).toHaveBeenCalledTimes(1);
    expect(mocks.insertSpy).toHaveBeenCalledTimes(1);
    expect(mocks.updateSpy).not.toHaveBeenCalled();
  });

  it('omite un ítem sin cambios (mismo hash) y NO re-embebe', async () => {
    const item = { biblionumber: '1', titulo: 'Cien años de soledad' };
    mocks.selectResult = {
      data: [{ id: 5, metadata: { koha_id: '1', content_hash: contentHashOf(item) } }],
      error: null,
    };

    const result = await service.upsertKohaItems([item]);

    expect(result).toEqual({ inserted: 0, updated: 0, skipped: 1, errors: 0 });
    expect(mocks.getEmbedding).not.toHaveBeenCalled();
    expect(mocks.insertSpy).not.toHaveBeenCalled();
    expect(mocks.updateSpy).not.toHaveBeenCalled();
  });

  it('actualiza un ítem existente cuyo contenido cambió (hash distinto)', async () => {
    mocks.selectResult = {
      data: [{ id: 5, metadata: { koha_id: '1', content_hash: 'hash-viejo' } }],
      error: null,
    };

    const result = await service.upsertKohaItems([{ biblionumber: '1', titulo: 'Título actualizado' }]);

    expect(result).toEqual({ inserted: 0, updated: 1, skipped: 0, errors: 0 });
    expect(mocks.getEmbedding).toHaveBeenCalledTimes(1);
    expect(mocks.updateSpy).toHaveBeenCalledTimes(1);
    expect(mocks.insertSpy).not.toHaveBeenCalled();
  });

  it('cuenta errores sin abortar el lote', async () => {
    mocks.selectResult = { data: [], error: { message: 'DB caída' } };

    const result = await service.upsertKohaItems([{ biblionumber: '1' }, { biblionumber: '2' }]);

    expect(result.errors).toBe(2);
    expect(result.inserted).toBe(0);
  });
});
