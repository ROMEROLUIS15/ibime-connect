import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '../../services/chat.service.js';
import type { ILLMProvider } from '../../domain/interfaces/index.js';

describe('ChatService', () => {
  let service: ChatService;
  let mockLLMProvider: ILLMProvider;
  let mockRAGService: any;

  beforeEach(() => {
    mockLLMProvider = {
      generateAnswer: vi.fn().mockResolvedValue({
        content: 'Respuesta de prueba',
        tokensUsed: 100,
        model: 'llama-3.1',
      }),
    };

    mockRAGService = {
      retrieveContext: vi.fn().mockResolvedValue({
        context: '\n\n== CONTEXTO ==\nInfo importante',
        sources: [
          { id: '1', title: 'Doc 1', content: 'Contenido', similarity: 0.9 },
        ],
      }),
    };

    service = new ChatService(mockLLMProvider, mockRAGService);
    vi.clearAllMocks();
  });

  it('should process chat with RAG context', async () => {
    const result = await service.processChat({
      userMessage: '¿Qué servicios?',
      conversationHistory: [],
    });

    expect(result.answer).toBe('Respuesta de prueba');
    expect(result.sources).toHaveLength(1);
    expect(result.tokensUsed).toBe(100);
    expect(mockRAGService.retrieveContext).toHaveBeenCalledWith('¿Qué servicios?', undefined, undefined);
  });

  it('should handle LLM errors gracefully', async () => {
    vi.mocked(mockLLMProvider.generateAnswer).mockRejectedValueOnce(
      new Error('LLM timeout')
    );

    await expect(
      service.processChat({
        userMessage: 'test',
        conversationHistory: [],
      })
    ).rejects.toThrow('LLM timeout');
  });

  it('should include conversation history in LLM call', async () => {
    await service.processChat({
      userMessage: 'Nueva pregunta',
      conversationHistory: [
        { role: 'user', text: 'Pregunta anterior' },
        { role: 'assistant', text: 'Respuesta anterior' },
      ],
    });

    const callArgs = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0][0];
    // system prompt + 2 history messages + 1 user message = 4
    expect(callArgs).toHaveLength(4);
    expect(callArgs[1].content).toBe('Pregunta anterior');
    expect(callArgs[2].content).toBe('Respuesta anterior');
    expect(callArgs[3].content).toBe('Nueva pregunta');
  });
});
