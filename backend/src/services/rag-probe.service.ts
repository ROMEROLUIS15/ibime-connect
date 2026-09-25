/**
 * RagProbeService — sondeo de recuperación para calibrar el umbral del RAG (RAG-05).
 *
 * Para cada pregunta calcula el embedding con el mismo servicio que usa el chat y pide
 * al repositorio los `topK` documentos más cercanos SIN umbral, para ver también los
 * aciertos que quedan por debajo del mínimo de recuperación (en el chat, el RPC ya
 * filtra por ese mínimo y esas similitudes nunca llegan a los logs).
 *
 * No llama al LLM, no usa la caché RAG y no escribe nada.
 */
import type { IEmbeddingService, IKnowledgeRepository } from '../domain/interfaces/index.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import { RAG_MIN_VALID_THRESHOLD } from './rag.service.js';

export const RAG_PROBE_MAX_QUESTIONS = 50;
export const RAG_PROBE_MAX_TOP_K = 10;
export const RAG_PROBE_DEFAULT_TOP_K = 5;

/** La similitud coseno está en [-1, 1]: con -1 el RPC no descarta ningún documento. */
const NO_THRESHOLD = -1;

/** Pausa entre preguntas por la cuota free-tier de Gemini (misma que usa la ingesta). */
const DEFAULT_PAUSE_MS = 400;

export interface RagProbeMatch {
  id: string;
  title: string;
  similarity: number;
}

export interface RagProbeResult {
  question: string;
  matches: RagProbeMatch[];
  best: number | null;
  /** Diferencia entre el primer y el segundo documento: criterio alternativo a un umbral absoluto. */
  margin: number | null;
  passesThreshold: boolean;
  error?: string;
}

export interface RagProbeReport {
  threshold: number;
  topK: number;
  results: RagProbeResult[];
  summary: { total: number; passing: number; failing: number; errors: number };
}

export class RagProbeService {
  constructor(
    private embeddingService: IEmbeddingService,
    private knowledgeRepository: IKnowledgeRepository,
    private pauseMs: number = DEFAULT_PAUSE_MS
  ) { }

  async probe(questions: string[], topK: number, requestId?: string): Promise<RagProbeReport> {
    const logger = contextLogger(requestId);
    const startTime = Date.now();
    const results: RagProbeResult[] = [];

    for (let i = 0; i < questions.length; i++) {
      if (i > 0 && this.pauseMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.pauseMs));
      }
      results.push(await this.probeQuestion(questions[i], topK, requestId));
    }

    const errors = results.filter((r) => r.error !== undefined).length;
    const passing = results.filter((r) => r.passesThreshold).length;
    const summary = { total: results.length, passing, failing: results.length - passing - errors, errors };

    // Solo conteos: el texto de las preguntas no se registra.
    logger.info('RAG probe completed', { ...summary, topK, duration: Date.now() - startTime });

    return { threshold: RAG_MIN_VALID_THRESHOLD, topK, results, summary };
  }

  private async probeQuestion(question: string, topK: number, requestId?: string): Promise<RagProbeResult> {
    try {
      const embedding = await this.embeddingService.getEmbedding(question, requestId);
      const matches = (await this.knowledgeRepository.matchKnowledge(embedding, topK, NO_THRESHOLD, requestId))
        .map((m) => ({ id: m.id, title: m.title, similarity: m.similarity }))
        .sort((a, b) => b.similarity - a.similarity);

      const best = matches.length > 0 ? matches[0].similarity : null;
      const margin = matches.length > 1 ? matches[0].similarity - matches[1].similarity : null;

      return { question, matches, best, margin, passesThreshold: best !== null && best >= RAG_MIN_VALID_THRESHOLD };
    } catch (error) {
      return { question, matches: [], best: null, margin: null, passesThreshold: false, error: (error as Error).message };
    }
  }
}
