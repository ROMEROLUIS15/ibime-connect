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

  describe('registration flow', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    // BRANCH B: sin email → el LLM pide el correo al usuario (no hay tools)
    it('should use RAG and LLM to ask for email when no email is present', async () => {
      vi.mocked(mockRAGService.retrieveContext).mockResolvedValue({
        context: '',
        sources: [],
        maxSimilarity: 0,
        hit: false,
      });

      await orchestrator.process({
        userMessage: '¿En qué cursos estoy inscrito?',
        conversationHistory: [],
      });

      // RAG is called in branch B
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
      // LLM is called to ask for the email
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalledTimes(1);
      // LLM is NOT given tools in branch B
      const options = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0][1] as any;
      expect(options.tools).toBeUndefined();
    });

    // BRANCH A: email en historial → tool directa, LLM NO se llama
    it('should bypass LLM entirely and call tool directly when email is in history', async () => {
      vi.spyOn(orchestrator['toolRegistry'], 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Taller de Python'] })
      );

      const result = await orchestrator.process({
        userMessage: '¿En qué cursos estoy inscrito?',
        conversationHistory: [
          { role: 'user', text: 'Mi correo es juan@test.com' },
        ],
      });

      expect(result.answer).toContain('Taller de Python');
      // LLM must NOT be called when email is already known
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      // Tool must be called directly with the email
      expect(orchestrator['toolRegistry'].executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        JSON.stringify({ email: 'juan@test.com' })
      );
    });

    // BRANCH A: email en mensaje actual → tool directa, LLM NO se llama
    it('should bypass LLM and call tool directly when email is in current message', async () => {
      vi.spyOn(orchestrator['toolRegistry'], 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Taller de Python'] })
      );

      const result = await orchestrator.process({
        userMessage: 'Mi correo es empty@test.com, ¿estoy inscrito?',
        conversationHistory: [],
      });

      expect(result.answer).toContain('Taller de Python');
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
    });

    // BRANCH A: tool devuelve vacío → fallback determinístico, sin LLM
    it('should return deterministic fallback when tool result is empty', async () => {
      vi.spyOn(orchestrator['toolRegistry'], 'executeTool').mockResolvedValue('');

      const result = await orchestrator.process({
        userMessage: '¿Estoy inscrito?',
        conversationHistory: [
          { role: 'user', text: 'empty@test.com' },
        ],
      });

      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(result.answer).toContain('No recibí respuesta');
    });

    // BRANCH A: tool devuelve JSON inválido → fallback determinístico, sin LLM
    it('should return deterministic fallback (NOT LLM) when tool result is invalid JSON', async () => {
      vi.spyOn(orchestrator['toolRegistry'], 'executeTool').mockResolvedValue('not valid json {{{');

      const result = await orchestrator.process({
        userMessage: '¿En qué cursos estoy inscrito?',
        conversationHistory: [
          { role: 'user', text: 'Mi correo es juan@test.com' },
        ],
      });

      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(result.answer).toContain('No pude interpretar');
      expect(result.answer).toContain('contactoibime@gmail.com');
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

  describe('extractEmailFromConversation', () => {
    it('should extract email from history', () => {
      const history = [
        { role: 'user' as const, text: 'Mi correo es Juan@TEST.COM' },
        { role: 'assistant' as const, text: 'Perfecto' },
      ];
      const result = orchestrator['extractEmailFromConversation'](history, '¿Cuáles son mis cursos?');
      expect(result).toBe('juan@test.com');
    });

    it('should extract email from current message in uppercase', () => {
      const result = orchestrator['extractEmailFromConversation']([], 'MI CORREO ES MARIA@EXAMPLE.COM');
      expect(result).toBe('maria@example.com');
    });

    it('should return null when no email present', () => {
      const result = orchestrator['extractEmailFromConversation']([], 'No tengo correo');
      expect(result).toBeNull();
    });

    it('should reject invalid email-like strings', () => {
      const result = orchestrator['extractEmailFromConversation']([], 'El usuario@no es válido');
      expect(result).toBeNull();
    });
  });

  describe('formatRegistrationResponse', () => {
    it('should format registered user with courses', () => {
      const result = orchestrator['formatRegistrationResponse'](
        { status: 'registrado', cantidad_cursos: 2, cursos: ['Taller A', 'Taller B'] },
        'test@test.com'
      );
      expect(result).toContain('Taller A');
      expect(result).toContain('Taller B');
      expect(result).toContain('2 curso(s)');
    });

    it('should use mensaje from no_registrado status', () => {
      const result = orchestrator['formatRegistrationResponse'](
        { status: 'no_registrado', mensaje: 'No se encontraron inscripciones para este correo.' },
        'test@test.com'
      );
      expect(result).toContain('No encontr');
      expect(result).toContain('test@test.com');
    });

    it('should expose server error message', () => {
      const result = orchestrator['formatRegistrationResponse'](
        { error: 'Connection timeout' },
        'test@test.com'
      );
      expect(result).toContain('inconveniente técnico');
      expect(result).toContain('test@test.com');
    });

    it('should return debug info for unexpected result', () => {
      const result = orchestrator['formatRegistrationResponse'](
        { unexpected: 'structure' },
        'test@test.com'
      );
      expect(result).toContain('No pude procesar');
      expect(result).toContain('test@test.com');
    });

    it('should handle null/undefined input gracefully', () => {
      const result = orchestrator['formatRegistrationResponse'](null as any, 'test@test.com');
      expect(result).toContain('No pude obtener');
      expect(result).toContain('contactoibime@gmail.com');
    });
  });


  describe('direct tool path — email from message/history', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call tool directly and return courses when email is in current message', async () => {
      vi.spyOn(orchestrator['toolRegistry'], 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 2, cursos: ['Taller A', 'Taller B'] })
      );

      const result = await orchestrator.process({
        userMessage: 'Mi correo es ana@test.com, ¿en qué cursos estoy?',
        conversationHistory: [],
      });

      expect(result.answer).toContain('Taller A');
      expect(result.answer).toContain('Taller B');
      // LLM must NOT be called
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(orchestrator['toolRegistry'].executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        JSON.stringify({ email: 'ana@test.com' })
      );
    });

    it('should call tool directly when email is in history and return courses', async () => {
      vi.spyOn(orchestrator['toolRegistry'], 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Alfabetización Digital'] })
      );

      const result = await orchestrator.process({
        userMessage: '¿Estoy inscrito en algún curso?',
        conversationHistory: [
          { role: 'user', text: 'Soy luis@email.com' },
        ],
      });

      expect(result.answer).toContain('Alfabetización Digital');
      // No preambles, no hallucinated addresses
      expect(result.answer).not.toContain('Norte');
      expect(result.answer).not.toContain('Calle 5');
      // LLM must NOT be called
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
    });
  });
});