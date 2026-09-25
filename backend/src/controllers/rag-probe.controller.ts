import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import container from '../infrastructure/di/container.js';
import {
  RagProbeService,
  RAG_PROBE_DEFAULT_TOP_K,
  RAG_PROBE_MAX_QUESTIONS,
  RAG_PROBE_MAX_TOP_K,
} from '../services/rag-probe.service.js';

const ragProbeSchema = z.object({
  questions: z.array(z.string().trim().min(1).max(500)).min(1).max(RAG_PROBE_MAX_QUESTIONS),
  topK: z.number().int().min(1).max(RAG_PROBE_MAX_TOP_K).optional(),
});

/**
 * POST /admin/rag-probe — admin-only. Mide la similitud de cada pregunta contra la base
 * de conocimiento para calibrar el umbral del RAG (RAG-05). Ver RagProbeService.
 */
export class RagProbeController {
  handleProbe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = ragProbeSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          text: 'Solicitud de sondeo inválida',
          details: validation.error.format(),
        });
      }

      const { questions, topK = RAG_PROBE_DEFAULT_TOP_K } = validation.data;
      const report = await container.resolve<RagProbeService>('RagProbeService').probe(questions, topK, req.requestId);

      return res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };
}
