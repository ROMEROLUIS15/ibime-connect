import { Client } from 'langsmith';
import { traceable } from 'langsmith/traceable';
import { ENV } from '../../config/env.config.js';

let client: Client | null = null;

function getClient(): Client | null {
  if (client !== null) return client;
  if (ENV.LANGSMITH_API_KEY && ENV.LANGSMITH_TRACING) {
    client = new Client({
      apiKey: ENV.LANGSMITH_API_KEY,
    });
  } else {
    client = null;
  }
  return client;
}

export function wrapLLM<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string,
  metadata?: Record<string, unknown>
): T {
  const c = getClient();
  if (!c) return fn;

  return traceable(fn, {
    name,
    run_type: 'llm',
    client: c,
    metadata,
    processInputs: (inputs: any) => sanitizeLLMInputs(inputs),
    processOutputs: (outputs: any) => sanitizeLLMOutputs(outputs),
  }) as T;
}

export function wrapChain<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string,
  metadata?: Record<string, unknown>,
  processInputs?: (inputs: any) => any
): T {
  const c = getClient();
  if (!c) return fn;

  return traceable(fn, {
    name,
    run_type: 'chain',
    client: c,
    metadata,
    processInputs: processInputs ?? ((inputs: any) => sanitizeChainInputs(inputs)),
  }) as T;
}

function sanitizeLLMInputs(inputs: any): any {
  if (!inputs || !Array.isArray(inputs)) return inputs;
  const [messages, options] = inputs;
  return { messageCount: messages?.length ?? 0, options };
}

function sanitizeLLMOutputs(outputs: any): any {
  if (!outputs) return outputs;
  return {
    tokensUsed: outputs.tokensUsed,
    model: outputs.model,
    hasToolCalls: !!outputs.toolCalls,
    contentLength: outputs.content?.length ?? 0,
  };
}

function sanitizeChainInputs(inputs: any): any {
  if (!inputs || !Array.isArray(inputs)) return { input: inputs };
  const [input] = inputs;
  // Los sub-handlers (handleRegistration/Catalog/General) y curate reciben el
  // texto como string posicional, NO como objeto. Sin este guard, el mensaje
  // crudo del usuario (email/teléfono) o el PDF completo se enviarían a LangSmith.
  if (typeof input === 'string') {
    return { inputLength: input.length };
  }
  if (input && typeof input === 'object') {
    const safe: Record<string, unknown> = {};
    if ('userMessage' in input) {
      safe.userMessageLength = (input as any).userMessage?.length;
      safe.historyLength = (input as any).conversationHistory?.length;
    }
    if ('rawText' in input) {
      safe.textLength = (input as any).rawText?.length;
    }
    return safe;
  }
  return { input };
}
