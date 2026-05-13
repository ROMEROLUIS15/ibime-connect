import type { ILLMProvider } from '../domain/interfaces/index.js';
import type { RAGService } from './rag.service.js';
import type { ChatResponse } from '@shared/types/domain.js';
import type { SessionMemoryService } from './session-memory.service.js';
import { ChatOrchestrator } from '../modules/chat/chat-orchestrator.js';
import { contextLogger } from '../infrastructure/logger/index.js';

export class ChatService {
  private orchestrator: ChatOrchestrator;

  constructor(
    llmProvider: ILLMProvider,
    ragService: RAGService,
    sessionMemory: SessionMemoryService | null = null
  ) {
    this.orchestrator = new ChatOrchestrator(llmProvider, ragService, sessionMemory);
  }

  async processChat(
    input: {
      userMessage: string;
      conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
      sessionId?: string;
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
        sessionId: input.sessionId,
      },
      requestId
    );
  }
}
