/**
 * src/application/use-cases/AskAssistantUseCase.ts
 *
 * Application Use Case for the virtual assistant.
 *
 * The RAG context retrieval is handled entirely by the backend (Edge Function).
 * This use case simply formats the input and calls the assistant port.
 */

import type { IAssistantPort } from '@/domain/ports/AssistantPort';
import type { ChatResponse, ApiResult } from '@shared/types/domain';

// ─── Input DTO ────────────────────────────────────────────────────────────────

export interface AskAssistantInput {
  readonly userMessage: string;
  readonly conversationHistory: ReadonlyArray<{ readonly role: 'user' | 'assistant'; readonly text: string }>;
}

// ─── Use Case ─────────────────────────────────────────────────────────────────

export class AskAssistantUseCase {
  constructor(private readonly assistantPort: IAssistantPort) {}

  async execute(input: AskAssistantInput): Promise<ApiResult<ChatResponse>> {
    // RAG retrieval is done natively by the Edge Function in the backend.
    return this.assistantPort.generateAnswer({
      userMessage: input.userMessage,
      conversationHistory: input.conversationHistory,
      context: [], // Ignored; backend injects it natively
    });
  }
}
