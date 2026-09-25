import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentController } from '../../controllers/agent.controller.js';
import { KnowledgeIngestionService, computeDocumentHash } from '../../services/knowledge-ingestion.service.js';
import type { CurationGraph } from '../../modules/agents/curation-graph.js';
import type { Request, Response, NextFunction } from 'express';

// --- Constants ----------------------------------------------------------------

const CURATED_ITEM = {
  title: 'Curso Merida',
  category: 'curso',
  content: 'Curso de pintura al oleo tradicional.',
  keyDetails: 'Sabados',
};

const SAMPLE_CURATE_RESULT = {
  approved: true,
  iterations: 1,
  conflicts: [],
  extractedItems: [CURATED_ITEM],
};

// --- Suite --------------------------------------------------------------------

describe('AgentController', () => {
  let controller: AgentController;
  let mockCurationGraph: CurationGraph;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCurationGraph = {
      curate: vi.fn().mockResolvedValue(SAMPLE_CURATE_RESULT),
    } as unknown as CurationGraph;

    controller = new AgentController(mockCurationGraph);

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('handleCurationRequest', () => {
    it('should forward a BadRequestError to next() when the body text is empty', async () => {
      // Arrange
      const req = { body: { text: '' } } as Request;

      // Act
      await controller.handleCurationRequest(req, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Debe proveer el texto del documento a analizar en el cuerpo (text).',
        })
      );
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 200 with the structured curation report when the body text is valid', async () => {
      // Arrange
      const inputText = 'Texto de prueba del catalogo de Merida';
      const req = { body: { text: inputText } } as Request;

      // Act
      await controller.handleCurationRequest(req, mockRes as Response, mockNext);

      // Assert — curate was called with the exact input
      expect(mockCurationGraph.curate).toHaveBeenCalledWith(inputText, undefined);

      // Assert — response shape matches curation contract
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          iterations: SAMPLE_CURATE_RESULT.iterations,
          conflicts: SAMPLE_CURATE_RESULT.conflicts,
          items: expect.any(Array),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('handleCurationRequest — document idempotency (RAG-06)', () => {
    const DOCUMENT_TEXT = 'Catalogo completo de talleres del IBIME';
    const ingestRequest = () => ({ body: { text: DOCUMENT_TEXT, ingest: true } }) as Request;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should skip curation and ingestion when the same document was already ingested', async () => {
      const lookupSpy = vi.spyOn(KnowledgeIngestionService.prototype, 'isDocumentIngested').mockResolvedValue(true);
      const ingestSpy = vi.spyOn(KnowledgeIngestionService.prototype, 'ingestChunks').mockResolvedValue({ success: 1, errors: 0 });

      await controller.handleCurationRequest(ingestRequest(), mockRes as Response, mockNext);

      expect(lookupSpy).toHaveBeenCalledWith(computeDocumentHash(DOCUMENT_TEXT), undefined);
      expect(mockCurationGraph.curate).not.toHaveBeenCalled();
      expect(ingestSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, items: [] }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should tag every ingested chunk with the document hash when the document is new', async () => {
      vi.spyOn(KnowledgeIngestionService.prototype, 'isDocumentIngested').mockResolvedValue(false);
      const ingestSpy = vi.spyOn(KnowledgeIngestionService.prototype, 'ingestChunks').mockResolvedValue({ success: 1, errors: 0 });

      await controller.handleCurationRequest(ingestRequest(), mockRes as Response, mockNext);

      expect(mockCurationGraph.curate).toHaveBeenCalledWith(DOCUMENT_TEXT, undefined);
      const [chunks] = ingestSpy.mock.calls[0];
      expect(chunks).toHaveLength(1);
      expect(chunks[0].metadata).toMatchObject({
        title: CURATED_ITEM.title,
        document_hash: computeDocumentHash(DOCUMENT_TEXT),
      });
    });

    it('should not look up the document hash for a curation-only request (no ingestion)', async () => {
      const lookupSpy = vi.spyOn(KnowledgeIngestionService.prototype, 'isDocumentIngested');

      await controller.handleCurationRequest({ body: { text: DOCUMENT_TEXT } } as Request, mockRes as Response, mockNext);

      expect(lookupSpy).not.toHaveBeenCalled();
      expect(mockCurationGraph.curate).toHaveBeenCalled();
    });
  });

  describe('handleCurationRequest — rollback of a partial ingestion', () => {
    const DOCUMENT_TEXT = 'Catalogo completo de talleres del IBIME';
    const ingestRequest = () => ({ body: { text: DOCUMENT_TEXT, ingest: true } }) as Request;

    beforeEach(() => {
      vi.spyOn(KnowledgeIngestionService.prototype, 'isDocumentIngested').mockResolvedValue(false);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should delete the whole document and report failure when some chunks could not be ingested', async () => {
      vi.spyOn(KnowledgeIngestionService.prototype, 'ingestChunks').mockResolvedValue({ success: 2, errors: 1 });
      const rollbackSpy = vi.spyOn(KnowledgeIngestionService.prototype, 'deleteDocumentChunks').mockResolvedValue(2);

      await controller.handleCurationRequest(ingestRequest(), mockRes as Response, mockNext);

      expect(rollbackSpy).toHaveBeenCalledWith(computeDocumentHash(DOCUMENT_TEXT), undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      const body = vi.mocked(mockRes.json!).mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.ingestion).toMatchObject({ success: 2, errors: 1, rolledBack: true });
      expect(body.conflicts.some((c: string) => /revirti/i.test(c))).toBe(true);
    });

    it('should not roll back when every chunk was ingested', async () => {
      vi.spyOn(KnowledgeIngestionService.prototype, 'ingestChunks').mockResolvedValue({ success: 1, errors: 0 });
      const rollbackSpy = vi.spyOn(KnowledgeIngestionService.prototype, 'deleteDocumentChunks');

      await controller.handleCurationRequest(ingestRequest(), mockRes as Response, mockNext);

      expect(rollbackSpy).not.toHaveBeenCalled();
      const body = vi.mocked(mockRes.json!).mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.ingestion).toEqual({ success: 1, errors: 0 });
    });

    it('should report a half-ingested document when the rollback itself fails', async () => {
      vi.spyOn(KnowledgeIngestionService.prototype, 'ingestChunks').mockResolvedValue({ success: 2, errors: 1 });
      vi.spyOn(KnowledgeIngestionService.prototype, 'deleteDocumentChunks').mockRejectedValue(new Error('DB caida'));

      await controller.handleCurationRequest(ingestRequest(), mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      const body = vi.mocked(mockRes.json!).mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.ingestion).toMatchObject({ rolledBack: false });
      expect(body.conflicts.some((c: string) => c.includes(computeDocumentHash(DOCUMENT_TEXT)))).toBe(true);
    });
  });
});
