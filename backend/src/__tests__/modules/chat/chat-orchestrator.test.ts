import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatOrchestrator } from '../../../modules/chat/chat-orchestrator.js';
import type { ILLMProvider } from '../../../domain/interfaces/index.js';
import type { RAGService } from '../../../services/rag.service.js';
import { ToolRegistry } from '../../../services/tools.service.js';

// --- Fixtures -----------------------------------------------------------------

const LLM_RESPONSE = {
  content: 'Respuesta del LLM',
  tokensUsed: 50,
  model: 'llama-3.1-8b-instant',
};

const RAG_HIT = {
  context: '\n\n== CONTEXTO ==\nInfo de cursos',
  sources: [{ id: '1', category: 'curso', title: 'Taller Python', content: 'Taller de Python', similarity: 0.8 }],
  maxSimilarity: 0.8,
  hit: true,
};

const RAG_MISS = { context: '', sources: [], maxSimilarity: 0, hit: false };

// --- Suite --------------------------------------------------------------------

describe('ChatOrchestrator', () => {
  let orchestrator: ChatOrchestrator;
  let mockLLMProvider: ILLMProvider;
  let mockRAGService: RAGService;

  beforeEach(() => {
    // Reset all mocks FIRST, then configure — prevents stale state leaking between tests
    vi.clearAllMocks();

    mockLLMProvider = {
      generateAnswer: vi.fn().mockResolvedValue(LLM_RESPONSE),
    };

    mockRAGService = {
      retrieveContext: vi.fn().mockResolvedValue(RAG_HIT),
    } as unknown as RAGService;

    // Default tool spy: single course result
    vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
      JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Taller de Python'] })
    );

    orchestrator = new ChatOrchestrator(mockLLMProvider, mockRAGService);
  });

  // ---------------------------------------------------------------------------
  describe('registration flow — no email in context', () => {
    it('should call RAG and LLM to ask the user for their email when no email is available', async () => {
      // Arrange
      vi.mocked(mockRAGService.retrieveContext).mockResolvedValue(RAG_MISS);

      // Act
      await orchestrator.process({ userMessage: 'En que cursos estoy inscrito?', conversationHistory: [] });

      // Assert
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalledTimes(1);
      const callOptions = vi.mocked(mockLLMProvider.generateAnswer).mock.calls[0][1];
      expect(callOptions).not.toBeNull();
      expect((callOptions as any)?.tools).toBeUndefined();
    });

    it('should bypass LLM and call tool directly when email is present in conversation history', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Taller de Python'] })
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'En que cursos estoy inscrito?',
        conversationHistory: [{ role: 'user', text: 'Mi correo es juan@test.com' }],
      });

      // Assert
      expect(result.answer).toContain('Taller de Python');
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(ToolRegistry.prototype.executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        JSON.stringify({ email: 'juan@test.com' })
      );
    });

    it('should bypass LLM and call tool directly when email is present in the current message', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Taller de Python'] })
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'Mi correo es empty@test.com, estoy inscrito?',
        conversationHistory: [],
      });

      // Assert
      expect(result.answer).toContain('Taller de Python');
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('conversation history inclusion', () => {
    it('should include system message + full history + new message in the LLM call', async () => {
      // Arrange
      const shortHistory = [
        { role: 'user' as const, text: 'User message 1' },
        { role: 'assistant' as const, text: 'Assistant message 1' },
        { role: 'user' as const, text: 'User message 2' },
        { role: 'assistant' as const, text: 'Assistant message 2' },
      ];

      // Act
      await orchestrator.process({ userMessage: 'Que cursos tienen?', conversationHistory: shortHistory });

      // Assert — system + 4 history + 1 new = 6
      const calls = vi.mocked(mockLLMProvider.generateAnswer).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toHaveLength(6);
    });

    it('should only include system message and new message when history is empty', async () => {
      // Act
      await orchestrator.process({ userMessage: 'Que cursos tienen?', conversationHistory: [] });

      // Assert — system + 1 new = 2
      const calls = vi.mocked(mockLLMProvider.generateAnswer).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  describe('intent classification routing', () => {
    it('should route a catalog query ("que cursos tienen") to RAG', async () => {
      // Act
      await orchestrator.process({ userMessage: 'Que cursos tienen?', conversationHistory: [] });

      // Assert
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });

    it('should route a registration query ("mis cursos") through RAG and the LLM', async () => {
      // Act
      await orchestrator.process({ userMessage: 'Cuales son mis cursos?', conversationHistory: [] });

      // Assert
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
    });

    it('should route "como me inscribo" as a catalog intent (future action, not registration query)', async () => {
      // Act
      await orchestrator.process({ userMessage: 'Como me inscribo en un taller?', conversationHistory: [] });

      // Assert
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('email extraction and normalization', () => {
    it('should extract email from history, normalize it to lowercase, and call the tool', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Taller A'] })
      );

      // Act
      await orchestrator.process({
        userMessage: 'Cuales son mis cursos?',
        conversationHistory: [
          { role: 'user', text: 'Mi correo es Juan@TEST.COM' },
          { role: 'assistant', text: 'Perfecto' },
        ],
      });

      // Assert — email must be lowercased before tool call
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(ToolRegistry.prototype.executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        expect.stringContaining('juan@test.com')
      );
    });

    it('should extract an uppercase email from the current message and normalize it', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Taller B'] })
      );

      // Act
      await orchestrator.process({ userMessage: 'MI CORREO ES MARIA@EXAMPLE.COM', conversationHistory: [] });

      // Assert
      expect(ToolRegistry.prototype.executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        expect.stringContaining('maria@example.com')
      );
    });

    it('should fall back to LLM when no email is found in message or history', async () => {
      // Act
      await orchestrator.process({ userMessage: 'No tengo correo', conversationHistory: [] });

      // Assert
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
    });

    it('should NOT treat an invalid email-like string as a valid email', async () => {
      // Act
      await orchestrator.process({ userMessage: 'El usuario@no es valido', conversationHistory: [] });

      // Assert — invalid email must not trigger the direct tool path
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('registration response formatting', () => {
    it('should format a list of enrolled courses when the tool returns "registrado" status', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 2, cursos: ['Taller A', 'Taller B'] })
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'En que cursos estoy?',
        conversationHistory: [{ role: 'user', text: 'test@test.com' }],
      });

      // Assert
      expect(result.answer).toContain('Taller A');
      expect(result.answer).toContain('Taller B');
      expect(result.answer).toContain('2 curso(s)');
    });

    it('should include the email in the "not registered" message for clarity', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'no_registrado', mensaje: 'No se encontraron inscripciones.' })
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'Estoy inscrito?',
        conversationHistory: [{ role: 'user', text: 'test@test.com' }],
      });

      // Assert
      expect(result.answer).toContain('No encontr');
      expect(result.answer).toContain('test@test.com');
    });

    it('should surface a human-friendly error message when the tool returns a server error', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ error: 'Connection timeout' })
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'Estoy inscrito?',
        conversationHistory: [{ role: 'user', text: 'test@test.com' }],
      });

      // Assert
      expect(result.answer).toContain('inconveniente');
      expect(result.answer).toContain('test@test.com');
    });

    it('should emit a graceful fallback when the tool returns an unexpected JSON structure', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ unexpected: 'structure' })
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'Estoy inscrito?',
        conversationHistory: [{ role: 'user', text: 'test@test.com' }],
      });

      // Assert
      expect(result.answer).toContain('No pude procesar');
      expect(result.answer).toContain('test@test.com');
    });

    it('should emit a support contact fallback when the tool returns null', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify(null)
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'Estoy inscrito?',
        conversationHistory: [{ role: 'user', text: 'test@test.com' }],
      });

      // Assert
      expect(result.answer).toContain('No pude obtener');
      expect(result.answer).toContain('contactoibime@gmail.com');
    });
  });

  // ---------------------------------------------------------------------------
  describe('direct tool path — email present at call time', () => {
    it('should call the tool directly and return all courses when email is in the current message', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 2, cursos: ['Taller A', 'Taller B'] })
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'Mi correo es ana@test.com, en que cursos estoy?',
        conversationHistory: [],
      });

      // Assert
      expect(result.answer).toContain('Taller A');
      expect(result.answer).toContain('Taller B');
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(ToolRegistry.prototype.executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        JSON.stringify({ email: 'ana@test.com' })
      );
    });

    it('should call the tool directly and return courses when email is in conversation history', async () => {
      // Arrange
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(
        JSON.stringify({ status: 'registrado', cantidad_cursos: 1, cursos: ['Alfabetizacion Digital'] })
      );

      // Act
      const result = await orchestrator.process({
        userMessage: 'Estoy inscrito en algun curso?',
        conversationHistory: [{ role: 'user', text: 'Soy luis@email.com' }],
      });

      // Assert
      expect(result.answer).toContain('Alfabetizacion Digital');
      expect(result.answer).not.toContain('Norte');
      expect(result.answer).not.toContain('Calle 5');
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
    });
  });
});
