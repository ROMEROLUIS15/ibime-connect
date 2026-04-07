/**
 * src/domain/ports/AssistantPort.ts
 *
 * Port (interface) for the LLM assistant.
 * The UI layer depends ONLY on this contract — never on Supabase, Gemini, etc.
 *
 * When the backend is decoupled, create a new adapter that calls
 * `fetch('/api/chat')` and implements this same interface.
 */

import type { KnowledgeMatch, ChatResponse, ApiResult } from '@shared/types/domain';

// ─── Input DTO ────────────────────────────────────────────────────────────────

export interface GenerateAnswerInput {
  readonly userMessage: string;
  readonly conversationHistory: ReadonlyArray<{ readonly role: 'user' | 'assistant'; readonly text: string }>;
  readonly context: readonly KnowledgeMatch[];
}

// ─── Port ─────────────────────────────────────────────────────────────────────

export interface IAssistantPort {
  generateAnswer(input: GenerateAnswerInput): Promise<ApiResult<ChatResponse>>;
}
