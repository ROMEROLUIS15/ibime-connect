import { ENV } from '../../config/env.config.js';
import { contextLogger } from '../logger/index.js';
import type { ILLMProvider, LLMMessage, LLMResponse, ITool } from '../../domain/interfaces/index.js';

export class GroqProvider implements ILLMProvider {
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly DEFAULT_MODEL = 'llama-3.1-8b-instant';
  private static readonly DEFAULT_TIMEOUT_MS = 25000;

  async generateAnswer(
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number; tools?: ITool[] },
    requestId?: string
  ): Promise<LLMResponse> {
    const logger = contextLogger(requestId);
    
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
      max_tokens: options?.maxTokens ?? 800,
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
      hasTools
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
      const message = data?.choices?.[0]?.message;
      const content = message?.content ?? null;
      const toolCalls = message?.tool_calls;

      if (!content && !toolCalls) {
        logger.error('Empty response from Groq (no content and no tools)', { duration });
        throw new Error('Empty response from Groq');
      }

      const tokensUsed = data?.usage?.total_tokens ?? 0;
      logger.info('LLM answer generated', { duration, tokensUsed, toolCallsCount: toolCalls?.length });

      return {
        content,
        tokensUsed,
        model: GroqProvider.DEFAULT_MODEL,
        toolCalls,
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
