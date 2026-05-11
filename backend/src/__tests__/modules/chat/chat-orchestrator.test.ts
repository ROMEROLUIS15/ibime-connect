import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatOrchestrator } from '../../../modules/chat/chat-orchestrator.js';
import type { ILLMProvider, LLMResponse } from '../../../domain/interfaces/index.js';
import type { RAGService } from '../../../services/rag.service.js';

describe('ChatOrchestrator', () => {
  let orchestrator: ChatOrchestrator;
  let mockLLMProvider: ILLMProvider;
  let mockRAGService: RAGService;

  beforeEach(() => {
    mockLLMProvider = {
      generateAnswer: vi.fn().mockResolvedValue({
        content: 'Respuesta del LLM',
        tokensUsed: 50,
        model: 'llama-3.1-8b-instant',
      }),
    };

    mockRAGService = {
      retrieveContext: vi.fn().mockResolvedValue({
        context: '\n\n== CONTEXTO ==\nInfo de cursos',
        sources: [
          { id: '1', category: 'curso', title: 'Taller Python', content: 'Taller de Python', similarity: 0.8 },
        ],
        maxSimilarity: 0.8,
        hit: true,
      }),
    } as unknown as RAGService;

    orchestrator = new ChatOrchestrator(mockLLMProvider, mockRAGService);
    vi.clearAllMocks();
  });

  describe('registration flow (tool calling)', () => {
    it('should use RAG for registration queries', async () => {
      await orchestrator.process({
        userMessage: '¿En qué cursos estoy inscrito?',
        conversationHistory: [],
      });

      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });

    it('should pass conversation history to LLM for context', async () => {
      const history = [
        { role: 'user' as const, text: 'Mi correo es juan@test.com' },
        { role: 'assistant' as const, text: 'Perfecto Juan, buscaré tus cursos.' },
      ];

      await orchestrator.process({
        userMessage: '¿Qué cursos tengo?',
        conversationHistory: history,
      });

      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
      const callArgs = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0];
      const messages = callArgs[0] as any[];
      
      // History should be included in the conversation
      expect(messages.length).toBeGreaterThan(3); // system + history + user
    });

    it('should pass tools to LLM for registration queries', async () => {
      await orchestrator.process({
        userMessage: '¿En qué cursos estoy?',
        conversationHistory: [],
      });

      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
      const callArgs = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0];
      const options = callArgs[1] as any;
      
      expect(options.tools).toBeDefined();
      expect(options.tools.length).toBeGreaterThan(0);
    });

    it('should handle tool calls and return formatted response', async () => {
      const mockToolCallResponse: LLMResponse = {
        content: 'Según los datos del sistema...',
        tokensUsed: 100,
        model: 'llama-3.1-8b-instant',
        toolCalls: [{
          id: 'call_123',
          type: 'function',
          function: {
            name: 'consultar_inscripciones',
            arguments: '{"email":"juan@test.com"}',
          },
        }],
      };

      vi.mocked(mockLLMProvider.generateAnswer)
        .mockResolvedValueOnce(mockToolCallResponse)
        .mockResolvedValueOnce({
          content: 'Encontré tus inscripciones: Taller de Python.',
          tokensUsed: 80,
          model: 'llama-3.1-8b-instant',
        });

      const result = await orchestrator.process({
        userMessage: '¿En qué cursos estoy inscrito?',
        conversationHistory: [
          { role: 'user', text: 'Mi correo es juan@test.com' }
        ],
      });

      expect(result.answer).toContain('Taller de Python');
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalledTimes(2);
    });
  });

  describe('catalog flow', () => {
    it('should use RAG for catalog queries', async () => {
      await orchestrator.process({
        userMessage: '¿Qué cursos tienen disponibles?',
        conversationHistory: [],
      });

      expect(mockRAGService.retrieveContext).toHaveBeenCalledWith(
        '¿Qué cursos tienen disponibles?',
        { matchCount: 5 },
        undefined
      );
    });

    it('should call LLM with RAG context', async () => {
      await orchestrator.process({
        userMessage: '¿Qué talleres hay?',
        conversationHistory: [],
      });

      expect(mockLLMProvider.generateAnswer).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0];
      const messages = callArgs[0] as any[];
      const systemMessage = messages[0].content;

      expect(systemMessage).toContain('CONTEXTO');
      expect(systemMessage).toContain('referencia para responder');
      expect(callArgs[1]).toMatchObject({ temperature: 0.3, maxTokens: 350 });
    });
  });

  describe('general flow', () => {
    it('should return deterministic greeting for "hola"', async () => {
      const result = await orchestrator.process({
        userMessage: 'Hola',
        conversationHistory: [],
      });

      expect(result.answer).toContain('Asistente IBIME');
      expect(result.tokensUsed).toBe(0);
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(mockRAGService.retrieveContext).not.toHaveBeenCalled();
    });

    it('should return deterministic greeting for "buenos días"', async () => {
      const result = await orchestrator.process({
        userMessage: 'Buenos días',
        conversationHistory: [],
      });

      expect(result.answer).toContain('Asistente IBIME');
      expect(result.tokensUsed).toBe(0);
    });

    it('should use RAG for non-greeting general queries', async () => {
      await orchestrator.process({
        userMessage: '¿Cuál es el horario de atención?',
        conversationHistory: [],
      });

      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });

    it('should use fallback LLM when RAG finds nothing', async () => {
      vi.mocked(mockRAGService.retrieveContext).mockResolvedValue({
        context: '',
        sources: [],
        maxSimilarity: 0,
        hit: false,
      });

      await orchestrator.process({
        userMessage: '¿Tienen servicio de préstamo digital?',
        conversationHistory: [],
      });

      expect(mockLLMProvider.generateAnswer).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0];
      expect(callArgs[1]).toMatchObject({ maxTokens: 300 });
    });
  });

  describe('history trimming', () => {
    it('should trim history to last 3 turns (6 messages) when exceeding limit', () => {
      const longHistory = [];
      for (let i = 0; i < 10; i++) {
        longHistory.push({ role: 'user' as const, text: `User message ${i}` });
        longHistory.push({ role: 'assistant' as const, text: `Assistant message ${i}` });
      }

      expect(longHistory.length).toBe(20);

      const trimmedHistory = orchestrator['trimHistory'](longHistory, 3);
      
      expect(trimmedHistory.length).toBe(6);
      
      expect(trimmedHistory[0]).toEqual({ role: 'user', text: 'User message 7' });
      expect(trimmedHistory[1]).toEqual({ role: 'assistant', text: 'Assistant message 7' });
      expect(trimmedHistory[2]).toEqual({ role: 'user', text: 'User message 8' });
      expect(trimmedHistory[3]).toEqual({ role: 'assistant', text: 'Assistant message 8' });
      expect(trimmedHistory[4]).toEqual({ role: 'user', text: 'User message 9' });
      expect(trimmedHistory[5]).toEqual({ role: 'assistant', text: 'Assistant message 9' });
    });

    it('should not trim history when under the limit', () => {
      const shortHistory = [
        { role: 'user' as const, text: 'User message 1' },
        { role: 'assistant' as const, text: 'Assistant message 1' },
        { role: 'user' as const, text: 'User message 2' },
        { role: 'assistant' as const, text: 'Assistant message 2' },
      ];

      const trimmedHistory = orchestrator['trimHistory'](shortHistory, 3);
      
      expect(trimmedHistory.length).toBe(4);
      expect(trimmedHistory).toEqual(shortHistory);
    });

    it('should handle empty history', () => {
      const emptyHistory: Array<{ role: 'user' | 'assistant'; text: string }> = [];
      const trimmedHistory = orchestrator['trimHistory'](emptyHistory, 3);
      
      expect(trimmedHistory.length).toBe(0);
      expect(trimmedHistory).toEqual([]);
    });
  });

  describe('intent classification integration', () => {
    it('should route "qué cursos tienen" to catalog', async () => {
      await orchestrator.process({
        userMessage: '¿Qué cursos tienen?',
        conversationHistory: [],
      });

      // Catalog → RAG
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });

    it('should route "mis cursos" to registration (with tool calling)', async () => {
      await orchestrator.process({
        userMessage: '¿Cuáles son mis cursos?',
        conversationHistory: [],
      });

      // Registration → RAG + LLM + Tools
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
    });

    it('should classify "cómo me inscribo" as catalog', async () => {
      await orchestrator.process({
        userMessage: '¿Cómo me inscribo en un taller?',
        conversationHistory: [],
      });

      // Should go to catalog, not registration
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });
  });
});