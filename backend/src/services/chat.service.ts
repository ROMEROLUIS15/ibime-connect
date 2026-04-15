/**
 * ChatService — Thin wrapper that delegates to ChatOrchestrator.
 *
 * The old ChatService mixed RAG, LLM, tool-calling, and business logic.
 * All decision-making has been moved to ChatOrchestrator with deterministic
 * intent classification. This class exists for backward compatibility with
 * the DI container and controller.
 *
 * @deprecated Use ChatOrchestrator directly. This wrapper will be removed
 *             once all references are migrated.
 */

import type { ILLMProvider } from '../domain/interfaces/index.js';
import type { RAGService } from './rag.service.js';
import type { ChatResponse } from '@shared/types/domain.js';
import { ChatOrchestrator } from '../modules/chat/chat-orchestrator.js';
import { contextLogger } from '../infrastructure/logger/index.js';

export class ChatService {
  private orchestrator: ChatOrchestrator;

  constructor(
    llmProvider: ILLMProvider,
    ragService: RAGService
  ) {
    this.orchestrator = new ChatOrchestrator(llmProvider, ragService);
  }

  async processChat(
    input: {
      userMessage: string;
      conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
      userEmail?: string;
    },
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    logger.info('ChatService delegating to ChatOrchestrator', {
      userMessageLength: input.userMessage.length,
      hasUserEmail: !!input.userEmail,
    });

    return this.orchestrator.process(
      {
        userMessage: input.userMessage,
        conversationHistory: input.conversationHistory,
        userEmail: input.userEmail,
      },
      requestId
    );
  }
}
