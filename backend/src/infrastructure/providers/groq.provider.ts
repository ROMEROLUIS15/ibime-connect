import { ENV } from '../../config/env.config.js';
import { contextLogger } from '../logger/index.js';
import type { ILLMProvider, LLMMessage, LLMResponse } from '../../domain/interfaces/index.js';

export class GroqProvider implements ILLMProvider {
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly DEFAULT_MODEL = 'llama-3.1-8b-instant';
  private static readonly DEFAULT_TIMEOUT_MS = 25000;

  async generateAnswer(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number },
    requestId?: string
  ): Promise<LLMResponse> {
    const logger = contextLogger(requestId);
    
    const payload = {
      model: GroqProvider.DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.6,
      max_tokens: options?.maxTokens ?? 800,
      top_p: 0.9,
    };

    logger.debug('Generating LLM answer', { 
      model: payload.model, 
      messageCount: messages.length,
      temperature: payload.temperature
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GroqProvider.DEFAULT_TIMEOUT_MS);
    const startTime = Date.now();

    try {
      const response = await fetch(GroqProvider.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Groq API error (${response.status})`, { error: errorBody, duration });
        throw new Error(`Groq API Error (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        logger.error('Empty response from Groq', { duration });
        throw new Error('Empty response from Groq');
      }

      const tokensUsed = data?.usage?.total_tokens ?? 0;
      logger.info('LLM answer generated', { duration, tokensUsed });

      return {
        content,
        tokensUsed,
        model: GroqProvider.DEFAULT_MODEL,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      if (error.name === 'AbortError') {
        logger.error('Groq request timeout', { duration });
        throw new Error('Groq request timeout (25s)');
      }
      logger.error('Failed to generate LLM answer', { error, duration });
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
