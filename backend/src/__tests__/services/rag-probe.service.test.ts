import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RagProbeService } from '../../services/rag-probe.service.js';
import { RAG_MIN_VALID_THRESHOLD } from '../../services/rag.service.js';
import type { IEmbeddingService, IKnowledgeRepository, KnowledgeMatch } from '../../domain/interfaces/index.js';

// --- Fixtures -----------------------------------------------------------------

const EMBEDDING = [0.1, 0.2, 0.3];

const match = (id: string, similarity: number): KnowledgeMatch => ({
  id,
  category: 'servicio',
  title: `Doc ${id}`,
  content: `Contenido ${id}`,
  similarity,
});

// --- Suite --------------------------------------------------------------------

describe('RagProbeService (RAG-05)', () => {
  let service: RagProbeService;
  let mockEmbeddingService: IEmbeddingService;
  let mockKnowledgeRepository: IKnowledgeRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEmbeddingService = { getEmbedding: vi.fn().mockResolvedValue(EMBEDDING) };
    mockKnowledgeRepository = { matchKnowledge: vi.fn().mockResolvedValue([match('9', 0.72)]) };

    // pauseMs = 0: sin espera entre preguntas en los tests.
    service = new RagProbeService(mockEmbeddingService, mockKnowledgeRepository, 0);
  });

  it('should embed each question once and ask the repository for the top-k with no similarity threshold', async () => {
    await service.probe(['¿Cuál es el horario?', '¿Dónde queda la sede?'], 3);

    expect(mockEmbeddingService.getEmbedding).toHaveBeenCalledTimes(2);
    expect(mockEmbeddingService.getEmbedding).toHaveBeenCalledWith('¿Cuál es el horario?', undefined);
    expect(mockKnowledgeRepository.matchKnowledge).toHaveBeenCalledTimes(2);
    expect(mockKnowledgeRepository.matchKnowledge).toHaveBeenCalledWith(EMBEDDING, 3, -1, undefined);
  });

  it('should report the best similarity, its margin over the second match and whether it passes the RAG threshold', async () => {
    // Desordenado a propósito: el reporte debe venir de mayor a menor.
    vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([match('12', 0.62), match('9', 0.7)]);

    const report = await service.probe(['¿Cuál es el horario?'], 5);
    const [result] = report.results;

    expect(result.matches).toEqual([
      { id: '9', title: 'Doc 9', similarity: 0.7 },
      { id: '12', title: 'Doc 12', similarity: 0.62 },
    ]);
    expect(result.best).toBe(0.7);
    expect(result.margin).toBeCloseTo(0.08, 10);
    expect(result.passesThreshold).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should flag a question whose best match falls below the RAG threshold', async () => {
    vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([match('13', 0.58)]);

    const [result] = (await service.probe(['Quiero inscribirme en un curso'], 5)).results;

    expect(result.best).toBe(0.58);
    expect(result.margin).toBeNull();
    expect(result.passesThreshold).toBe(false);
  });

  it('should treat a best similarity exactly at the threshold as passing, like the RAG does', async () => {
    vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([match('9', RAG_MIN_VALID_THRESHOLD)]);

    const [result] = (await service.probe(['¿Cuál es el horario?'], 5)).results;

    expect(result.passesThreshold).toBe(true);
  });

  it('should report no best match when the knowledge base returns nothing', async () => {
    vi.mocked(mockKnowledgeRepository.matchKnowledge).mockResolvedValueOnce([]);

    const [result] = (await service.probe(['¿Cuál es la capital de Francia?'], 5)).results;

    expect(result).toMatchObject({ matches: [], best: null, margin: null, passesThreshold: false });
  });

  it('should keep probing the remaining questions when one of them fails', async () => {
    vi.mocked(mockEmbeddingService.getEmbedding).mockRejectedValueOnce(new Error('Gemini API Error (429): quota'));

    const report = await service.probe(['falla', '¿Cuál es el horario?'], 5);

    expect(report.results[0]).toMatchObject({ question: 'falla', matches: [], best: null, passesThreshold: false });
    expect(report.results[0].error).toContain('429');
    expect(report.results[1]).toMatchObject({ question: '¿Cuál es el horario?', best: 0.72, passesThreshold: true });
  });

  it('should summarize the batch against the same threshold the RAG uses', async () => {
    vi.mocked(mockKnowledgeRepository.matchKnowledge)
      .mockResolvedValueOnce([match('9', 0.72)])
      .mockResolvedValueOnce([match('13', 0.58)]);
    vi.mocked(mockEmbeddingService.getEmbedding)
      .mockResolvedValueOnce(EMBEDDING)
      .mockResolvedValueOnce(EMBEDDING)
      .mockRejectedValueOnce(new Error('timeout'));

    const report = await service.probe(['a', 'b', 'c'], 4);

    expect(report.threshold).toBe(RAG_MIN_VALID_THRESHOLD);
    expect(report.topK).toBe(4);
    expect(report.summary).toEqual({ total: 3, passing: 1, failing: 1, errors: 1 });
  });
});
