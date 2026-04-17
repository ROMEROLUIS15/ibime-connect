import { ENV } from '../../config/env.config.js';
import { contextLogger } from '../logger/index.js';
import type { ILLMProvider, LLMMessage, LLMResponse, ITool } from '../../domain/interfaces/index.js';
import { groqRateLimiter } from './groq-rate-limiter.js';

/**
 * GroqProvider — LLM inference via Groq API (OpenAI-compatible).
 *
 * Token-budget orchestration:
 *   1. Pre-call: GroqRateLimiter.canProceed() checks the Redis sliding window
 *      at 80% of the real free-tier limits. Throws a friendly error if saturated.
 *   2. Post-call: GroqRateLimiter.recordUsage() records the actual token cost.
 *   3. 429 handling: if Groq rejects with 429, waits Retry-After ms and retries once.
 */
export class GroqProvider implements ILLMProvider {
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly DEFAULT_MODEL = 'llama-3.1-8b-instant';
  private static readonly DEFAULT_TIMEOUT_MS = 25000;
  /** Maximum wait time for a Retry-After backoff (capped to avoid blocking too long) */
  private static readonly MAX_RETRY_WAIT_MS = 5_000;

  async generateAnswer(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number; tools?: ITool[] },
    requestId?: string
  ): Promise<LLMResponse> {
    const logger = contextLogger(requestId);

    // ── Pre-call: check rate limit ───────────────────────────────────────────
    const estimatedTokens = options?.maxTokens ?? 350;
    const rlCheck = await groqRateLimiter.canProceed(estimatedTokens);

    if (!rlCheck.ok) {
      const waitSec = Math.ceil((rlCheck.waitMs ?? 60_000) / 1_000);
      logger.warn(
        'GroqProvider: rate limit reached — rejecting request',
        { reason: rlCheck.reason, waitMs: rlCheck.waitMs }
      );
      throw new Error(
        `RATE_LIMIT_EXCEEDED:${waitSec}:El asistente está muy ocupado en este momento. Por favor intenta de nuevo en ${waitSec} segundos.`
      );
    }

    // Remap local format to OpenAI/Groq format
    const formattedMessages = messages.map(m => {
      const msg: any = { role: m.role, content: m.content || "" };
      if (m.name) msg.name = m.name;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      return msg;
    });

    const hasTools = options?.tools && options.tools.length > 0;

    const payload: any = {
      model: GroqProvider.DEFAULT_MODEL,
      messages: formattedMessages,
      temperature: options?.temperature ?? 0.6,
      max_tokens: options?.maxTokens ?? 350,
      top_p: 0.9,
    };

    if (hasTools) {
      payload.tools = options!.tools!.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      }));
      payload.tool_choice = 'auto';
    }

    logger.debug('Generating LLM answer', {
      model: payload.model,
      messageCount: messages.length,
      temperature: payload.temperature,
      maxTokens: payload.max_tokens,
      hasTools
    });

    return this.callWithRetry(payload, requestId, logger);
  }

  // ── Internal: single API call ─────────────────────────────────────────────

  private async callGroqAPI(
    payload: any,
    requestId: string | undefined,
    logger: ReturnType<typeof contextLogger>
  ): Promise<{ data: any; duration: number }> {
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

      if (response.status === 429) {
        // Return the raw response so the retry handler can read Retry-After
        return { data: response, duration };
      }

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Groq API error (${response.status})`, { error: errorBody, duration });
        throw new Error(`Groq API Error (${response.status}): ${errorBody}`);
      }

      const data = await response.json() as any;
      return { data, duration };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      if (error.name === 'AbortError') {
        logger.error('Groq request timeout', { duration });
        throw new Error('Groq request timeout (25s)', { cause: error });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Internal: call + optional 429 retry ──────────────────────────────────

  private async callWithRetry(
    payload: any,
    requestId: string | undefined,
    logger: ReturnType<typeof contextLogger>,
    attempt = 1
  ): Promise<LLMResponse> {
    const { data, duration } = await this.callGroqAPI(payload, requestId, logger);

    // Handle 429 with one automatic retry
    if (data instanceof Response && data.status === 429) {
      if (attempt >= 2) {
        logger.error('Groq 429 on retry — giving up', { duration });
        throw new Error('RATE_LIMIT_EXCEEDED:60:El asistente está muy ocupado. Por favor intenta en un momento.');
      }

      const retryAfterHeader = data.headers.get('retry-after');
      const retryAfterSec = retryAfterHeader ? parseFloat(retryAfterHeader) : 5;
      const waitMs = Math.min(retryAfterSec * 1_000, GroqProvider.MAX_RETRY_WAIT_MS);

      logger.warn(
        'Groq 429 — waiting before retry',
        { retryAfterSec, waitMs, attempt }
      );

      await new Promise(resolve => setTimeout(resolve, waitMs));
      return this.callWithRetry(payload, requestId, logger, attempt + 1);
    }

    // ── Success path ──────────────────────────────────────────────────────
    const message = data?.choices?.[0]?.message;
    const content = message?.content ?? null;
    const toolCalls = message?.tool_calls;

    if (!content && !toolCalls) {
      logger.error('Empty response from Groq (no content and no tools)', { duration });
      throw new Error('Empty response from Groq');
    }

    const tokensUsed = data?.usage?.total_tokens ?? 0;
    logger.info('LLM answer generated', { duration, tokensUsed, toolCallsCount: toolCalls?.length });

    // ── Post-call: record actual usage in the sliding window ──────────────
    await groqRateLimiter.recordUsage(tokensUsed);

    return {
      content,
      tokensUsed,
      model: GroqProvider.DEFAULT_MODEL,
      toolCalls,
    };
  }
}

