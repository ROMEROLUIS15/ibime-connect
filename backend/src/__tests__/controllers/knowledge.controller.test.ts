import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { KnowledgeController, MAX_KOHA_ITEMS_PER_REQUEST } from '../../controllers/knowledge.controller.js';
import { KnowledgeIngestionService } from '../../services/knowledge-ingestion.service.js';

// --- Helpers ------------------------------------------------------------------

const kohaItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ biblionumber: String(i + 1), titulo: `Libro ${i + 1}` }));

const webhookRequest = (body: unknown) => ({ body, headers: {} }) as unknown as Request;

const UPSERT_RESULT = { inserted: 1, updated: 0, skipped: 0, errors: 0 };

// --- Suite --------------------------------------------------------------------

describe('KnowledgeController.kohaWebhook', () => {
  let controller: KnowledgeController;
  let mockRes: Partial<Response>;
  let upsertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    upsertSpy = vi.spyOn(KnowledgeIngestionService.prototype, 'upsertKohaItems').mockResolvedValue(UPSERT_RESULT);
    controller = new KnowledgeController();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject with 400 when the body is not a JSON array', async () => {
    await controller.kohaWebhook(webhookRequest({ biblionumber: '1' }), mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  describe('batch limit (RAG-08)', () => {
    it('should process a batch of exactly the maximum size synchronously', async () => {
      const items = kohaItems(MAX_KOHA_ITEMS_PER_REQUEST);

      await controller.kohaWebhook(webhookRequest(items), mockRes as Response);

      expect(upsertSpy).toHaveBeenCalledWith(items, 'catalogo', undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ registrosRecibidos: MAX_KOHA_ITEMS_PER_REQUEST, resultado: UPSERT_RESULT })
      );
    });

    it('should reject with 413 and ingest nothing when the batch exceeds the maximum', async () => {
      const oversized = MAX_KOHA_ITEMS_PER_REQUEST + 1;

      await controller.kohaWebhook(webhookRequest(kohaItems(oversized)), mockRes as Response);

      expect(upsertSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ registrosRecibidos: oversized, maxItems: MAX_KOHA_ITEMS_PER_REQUEST })
      );
    });
  });
});
