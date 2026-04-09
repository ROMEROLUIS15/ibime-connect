import { ENV } from '../config/env.config.js';
import { contextLogger } from '../infrastructure/logger/index.js';
import type { IEmbeddingService } from '../domain/interfaces/index.js';

export class EmbeddingService implements IEmbeddingService {
  static readonly MODEL = 'gemini-embedding-001';
  private static readonly GEMINI_API_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/${EmbeddingService.MODEL}:embedContent`;

  async getEmbedding(text: string, requestId?: string): Promise<number[]> {
    const logger = contextLogger(requestId);

    if (!text || text.trim().length === 0) {
      logger.error('Text cannot be empty');
      throw new Error('Text cannot be empty');
    }

    logger.debug('Getting embedding for text', { textLength: text.length });
    const startTime = Date.now();

    try {
      const response = await fetch(EmbeddingService.GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': ENV.GEMINI_API_KEY as string,
        },
        body: JSON.stringify({
          model: `models/${EmbeddingService.MODEL}`,
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        logger.error(`Gemini API error (${response.status})`, { error, duration });
        throw new Error(`Gemini API Error (${response.status}): ${error}`);
      }

      const data = (await response.json()) as { embedding: { values: number[] } };

      logger.info('Embedding generated successfully', {
        duration,
        dimensions: data.embedding.values.length,
      });

      return data.embedding.values;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get embedding', { error, duration });
      throw error;
    }
  }
}
