import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatOrchestrator } from '../../../modules/chat/chat-orchestrator.js';
import type { ILLMProvider } from '../../../domain/interfaces/index.js';
import type { RAGService } from '../../../services/rag.service.js';
import * as RegistrationServiceModule from '../../../services/registration.service.js';

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

  describe('registration flow', () => {
    it('should return deterministic response when no email is provided', async () => {
      const result = await orchestrator.process({
        userMessage: '¿En qué cursos estoy inscrito?',
        conversationHistory: [],
      });

      expect(result.answer).toContain('correo electrónico');
      expect(result.sources).toHaveLength(0);
      expect(result.tokensUsed).toBe(0);
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(mockRAGService.retrieveContext).not.toHaveBeenCalled();
    });

    it('should query DB directly when email is provided', async () => {
      vi.spyOn(RegistrationServiceModule.RegistrationService, 'findByEmail')
        .mockResolvedValue([
          { course_name: 'Taller de Python', name: 'Juan', created_at: '2024-01-01' },
        ]);

      await orchestrator.process({
        userMessage: '¿En qué cursos estoy inscrito?',
        conversationHistory: [],
        userEmail: 'juan@test.com',
      });

      expect(RegistrationServiceModule.RegistrationService.findByEmail).toHaveBeenCalledWith('juan@test.com', undefined);
      expect(mockRAGService.retrieveContext).not.toHaveBeenCalled();
    });

    it('should pass DB results to LLM for formatting only', async () => {
      vi.spyOn(RegistrationServiceModule.RegistrationService, 'findByEmail')
        .mockResolvedValue([
          { course_name: 'Taller de Python', name: 'Juan', created_at: '2024-01-01' },
          { course_name: 'Taller de Excel', name: 'Juan', created_at: '2024-02-01' },
        ]);

      await orchestrator.process({
        userMessage: '¿Cuáles son mis cursos?',
        conversationHistory: [],
        userEmail: 'juan@test.com',
      });

      expect(mockLLMProvider.generateAnswer).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0];
      const messages = callArgs[0];
      const systemMessage = messages[0].content;

      // Verify DB results are injected into system prompt
      expect(systemMessage).toContain('Taller de Python');
      expect(systemMessage).toContain('Taller de Excel');

      // Verify low temperature for formatting task with new maxTokens
      expect(callArgs[1]).toMatchObject({ temperature: 0.2, maxTokens: 250 });
    });

    it('should NOT use RAG for registration queries', async () => {
      vi.spyOn(RegistrationServiceModule.RegistrationService, 'findByEmail')
        .mockResolvedValue([]);

      await orchestrator.process({
        userMessage: '¿Estoy inscrito en algún curso?',
        conversationHistory: [],
        userEmail: 'test@test.com',
      });

      expect(mockRAGService.retrieveContext).not.toHaveBeenCalled();
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
      const messages = callArgs[0];
      const systemMessage = messages[0].content;

      // System prompt should contain RAG context marker
      expect(systemMessage).toContain('CONTEXTO');
      expect(systemMessage).toContain('referencia para responder');

      // Temperature should be low for factual responses with new maxTokens
      expect(callArgs[1]).toMatchObject({ temperature: 0.3, maxTokens: 350 });
    });

    it('should NOT query registration DB for catalog queries', async () => {
      const findByEmailSpy = vi.spyOn(RegistrationServiceModule.RegistrationService, 'findByEmail');

      await orchestrator.process({
        userMessage: '¿Qué cursos ofrecen?',
        conversationHistory: [],
      });

      expect(findByEmailSpy).not.toHaveBeenCalled();
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

      // Should still call LLM but with fallback prompt with new maxTokens
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0];
      expect(callArgs[1]).toMatchObject({ maxTokens: 300 }); // New fallback value
    });
  });

  describe('history trimming', () => {
    it('should trim history to last 3 turns (6 messages) when exceeding limit', () => {
      // Create a long conversation history
      const longHistory = [];
      for (let i = 0; i < 10; i++) {
        longHistory.push({ role: 'user' as const, text: `User message ${i}` });
        longHistory.push({ role: 'assistant' as const, text: `Assistant message ${i}` });
      }

      // Verify original history length
      expect(longHistory.length).toBe(20);

      // Apply trimming (should keep last 6 messages: 3 turns)
      const trimmedHistory = orchestrator['trimHistory'](longHistory, 3);
      
      expect(trimmedHistory.length).toBe(6); // 3 user + 3 assistant messages
      
      // Check that it's the last 6 messages
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
      
      // Should remain unchanged (4 messages < 6 max)
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
    it('should route "qué cursos tienen" to catalog (NOT registration)', async () => {
      const findByEmailSpy = vi.spyOn(RegistrationServiceModule.RegistrationService, 'findByEmail');

      await orchestrator.process({
        userMessage: '¿Qué cursos tienen?',
        conversationHistory: [],
      });

      // Catalog → RAG, NOT registration DB
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
      expect(findByEmailSpy).not.toHaveBeenCalled();
    });

    it('should route "mis cursos" to registration (NOT RAG)', async () => {
      vi.spyOn(RegistrationServiceModule.RegistrationService, 'findByEmail')
        .mockResolvedValue([]);

      await orchestrator.process({
        userMessage: '¿Cuáles son mis cursos?',
        conversationHistory: [],
        userEmail: 'test@test.com',
      });

      // Registration → DB, NOT RAG
      expect(RegistrationServiceModule.RegistrationService.findByEmail).toHaveBeenCalled();
      expect(mockRAGService.retrieveContext).not.toHaveBeenCalled();
    });
  });
});