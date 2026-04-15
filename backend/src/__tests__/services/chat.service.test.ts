import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '../../services/chat.service.js';
import type { ILLMProvider } from '../../domain/interfaces/index.js';
import type { RAGService } from '../../services/rag.service.js';

describe('ChatService', () => {
  let service: ChatService;
  let mockLLMProvider: ILLMProvider;
  let mockRAGService: RAGService;

  beforeEach(() => {
    mockLLMProvider = {
      generateAnswer: vi.fn().mockResolvedValue({
        content: 'Respuesta de prueba',
        tokensUsed: 100,
        model: 'llama-3.1-8b-instant',
      }),
    };

    mockRAGService = {
      retrieveContext: vi.fn().mockResolvedValue({
        context: '\n\n== CONTEXTO ==\nInfo importante',
        sources: [
          { id: '1', category: 'servicio', title: 'Doc 1', content: 'Contenido', similarity: 0.9 },
        ],
        maxSimilarity: 0.9,
        hit: true,
      }),
    } as unknown as RAGService;

    service = new ChatService(mockLLMProvider, mockRAGService);
    vi.clearAllMocks();
  });

  it('should process general queries with RAG context', async () => {
    const result = await service.processChat({
      userMessage: '¿Qué servicios?',
      conversationHistory: [],
    });

    expect(result.answer).toBe('Respuesta de prueba');
    expect(result.sources).toHaveLength(1);
    expect(result.tokensUsed).toBe(100);
    expect(mockRAGService.retrieveContext).toHaveBeenCalledWith('¿Qué servicios?', { matchCount: 5 }, undefined);
  });

  it('should handle registration query without email (deterministic)', async () => {
    const result = await service.processChat({
      userMessage: '¿En qué cursos estoy inscrito?',
      conversationHistory: [],
    });

    expect(result.answer).toContain('correo electrónico');
    expect(result.tokensUsed).toBe(0);
    expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
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

  it('should NOT use RAG for greetings', async () => {
    const result = await service.processChat({
      userMessage: 'Hola',
      conversationHistory: [],
    });

    expect(result.answer).toContain('Asistente IBIME');
    expect(result.tokensUsed).toBe(0);
    expect(mockRAGService.retrieveContext).not.toHaveBeenCalled();
  });

  it('should route catalog queries to RAG (not registration)', async () => {
    await service.processChat({
      userMessage: '¿Qué cursos tienen disponibles?',
      conversationHistory: [],
    });

    expect(mockRAGService.retrieveContext).toHaveBeenCalled();
  });
});
