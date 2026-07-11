import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '../../services/chat.service.js';
import type { ILLMProvider } from '../../domain/interfaces/index.js';
import type { RAGService } from '../../services/rag.service.js';

// --- Fixtures -----------------------------------------------------------------

const LLM_RESPONSE = {
  content: 'Respuesta de prueba',
  tokensUsed: 100,
  model: 'openai/gpt-oss-20b',
};

const RAG_RESULT = {
  context: '\n\n== CONTEXTO ==\nInfo importante',
  sources: [
    { id: '1', category: 'servicio', title: 'Doc 1', content: 'Contenido', similarity: 0.9 },
  ],
  maxSimilarity: 0.9,
  hit: true,
};

// --- Suite --------------------------------------------------------------------

describe('ChatService', () => {
  let service: ChatService;
  let mockLLMProvider: ILLMProvider;
  let mockRAGService: RAGService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLLMProvider = {
      generateAnswer: vi.fn().mockResolvedValue(LLM_RESPONSE),
    };

    mockRAGService = {
      retrieveContext: vi.fn().mockResolvedValue(RAG_RESULT),
    } as unknown as RAGService;

    service = new ChatService(mockLLMProvider, mockRAGService);
  });

  describe('processChat — general queries', () => {
    it('should retrieve RAG context and return the LLM answer with sources', async () => {
      // Arrange
      const input = { userMessage: 'Que servicios?', conversationHistory: [] };

      // Act
      const result = await service.processChat(input);

      // Assert
      expect(result.answer).toBe(LLM_RESPONSE.content);
      expect(result.sources).toHaveLength(1);
      expect(result.tokensUsed).toBe(LLM_RESPONSE.tokensUsed);
      expect(mockRAGService.retrieveContext).toHaveBeenCalledWith(
        input.userMessage,
        { matchCount: 5 },
        undefined
      );
    });

    it('should route catalog queries through RAG (not registration)', async () => {
      // Arrange
      const input = { userMessage: 'Que cursos tienen disponibles?', conversationHistory: [] };

      // Act
      await service.processChat(input);

      // Assert
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });
  });

  describe('processChat — registration queries', () => {
    it('should invoke LLM and RAG when processing a registration intent', async () => {
      // Arrange
      const input = { userMessage: 'En que cursos estoy inscrito?', conversationHistory: [] };

      // Act
      const result = await service.processChat(input);

      // Assert
      expect(result.answer).toBe(LLM_RESPONSE.content);
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
    });
  });

  describe('processChat — conversation history', () => {
    it('should build messages array with system + history + new message in correct order', async () => {
      // Arrange
      const input = {
        userMessage: 'Nueva pregunta',
        conversationHistory: [
          { role: 'user' as const, text: 'Pregunta anterior' },
          { role: 'assistant' as const, text: 'Respuesta anterior' },
        ],
      };

      // Act
      await service.processChat(input);

      // Assert — verify messages were received by the LLM
      const calls = vi.mocked(mockLLMProvider.generateAnswer).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const messages = calls[0][0];
      expect(messages).toHaveLength(4);
      expect(messages[0].role).toBe('system');
      expect(messages[1]).toMatchObject({ role: 'user', content: 'Pregunta anterior' });
      expect(messages[2]).toMatchObject({ role: 'assistant', content: 'Respuesta anterior' });
      expect(messages[3]).toMatchObject({ role: 'user', content: 'Nueva pregunta' });
    });
  });

  describe('processChat — greeting shortcut', () => {
    it('should return a deterministic greeting without calling RAG or the LLM', async () => {
      // Arrange
      const input = { userMessage: 'Hola', conversationHistory: [] };

      // Act
      const result = await service.processChat(input);

      // Assert
      expect(result.answer).toContain('Asistente IBIME');
      expect(result.tokensUsed).toBe(0);
      expect(mockRAGService.retrieveContext).not.toHaveBeenCalled();
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
    });
  });
});
