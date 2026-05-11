/**
 * ChatService — Wrapper that delegates to ChatOrchestrator.
 *
 * Maintains backward compatibility with the DI container and controller
 * while delegating all logic to the ChatOrchestrator with tool calling.
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
    },
    requestId?: string
  ): Promise<ChatResponse> {
    const logger = contextLogger(requestId);
    logger.info('ChatService delegating to ChatOrchestrator', {
      userMessageLength: input.userMessage.length,
      historyLength: input.conversationHistory.length,
    });

    return this.orchestrator.process(
      {
        userMessage: input.userMessage,
        conversationHistory: input.conversationHistory,
      },
      requestId
    );
  }
}
