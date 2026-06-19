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

/** Resultado de la tool cuando la propiedad SÍ se verificó (teléfono coincide). */
const verified = (cursos: string[]) =>
  JSON.stringify({ status: 'verified', cantidad_cursos: cursos.length, cursos });

/** Resultado genérico anti-enumeración (correo inexistente O teléfono no coincide). */
const NOT_VERIFIED = JSON.stringify({ status: 'not_verified' });

// --- Suite --------------------------------------------------------------------

describe('ChatOrchestrator', () => {
  let orchestrator: ChatOrchestrator;
  let mockLLMProvider: ILLMProvider;
  let mockRAGService: RAGService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLLMProvider = {
      generateAnswer: vi.fn().mockResolvedValue(LLM_RESPONSE),
    };

    mockRAGService = {
      retrieveContext: vi.fn().mockResolvedValue(RAG_HIT),
    } as unknown as RAGService;

    // Por defecto la tool verifica con un curso; cada test puede sobreescribirlo.
    vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(verified(['Taller de Python']));

    orchestrator = new ChatOrchestrator(mockLLMProvider, mockRAGService);
  });

  // ---------------------------------------------------------------------------
  describe('registration flow — gathering identity', () => {
    it('should ask the user for their email (via LLM) when no email is available', async () => {
      vi.mocked(mockRAGService.retrieveContext).mockResolvedValue(RAG_MISS);

      await orchestrator.process({ userMessage: 'En que cursos estoy inscrito?', conversationHistory: [] });

      expect(mockLLMProvider.generateAnswer).toHaveBeenCalledTimes(1);
      expect(ToolRegistry.prototype.executeTool).not.toHaveBeenCalled();
    });

    it('should ask for the phone (deterministically) when email is known but phone is missing', async () => {
      const result = await orchestrator.process({
        userMessage: 'En que cursos estoy inscrito?',
        conversationHistory: [{ role: 'user', text: 'Mi correo es juan@test.com' }],
      });

      // No revela cursos, no llama al LLM, y NO consulta la DB sin teléfono.
      expect(result.answer.toLowerCase()).toContain('teléfono');
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(ToolRegistry.prototype.executeTool).not.toHaveBeenCalled();
    });

    it('should NOT capture the phone from the assistant messages (e.g. the contact number)', async () => {
      const result = await orchestrator.process({
        userMessage: 'Sigo sin ver mis cursos',
        conversationHistory: [
          { role: 'user', text: 'Mi correo es juan@test.com' },
          { role: 'assistant', text: 'Puedes contactarnos al 0274-2623898 si lo necesitas.' },
        ],
      });

      // El número del asistente no debe contar como teléfono del usuario.
      expect(result.answer.toLowerCase()).toContain('teléfono');
      expect(ToolRegistry.prototype.executeTool).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('registration flow — ownership verification', () => {
    it('should reveal courses and pass email+phone to the tool when both are present', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(verified(['Taller A', 'Taller B']));

      const result = await orchestrator.process({
        userMessage: 'Mi correo es ana@test.com y mi telefono 04121234567',
        conversationHistory: [],
      });

      expect(result.answer).toContain('Taller A');
      expect(result.answer).toContain('Taller B');
      expect(result.answer).toContain('2 curso(s)');
      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(ToolRegistry.prototype.executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        JSON.stringify({ email: 'ana@test.com', phone: '04121234567' })
      );
    });

    it('should gather email (history) and phone (current message) across turns', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(verified(['Alfabetizacion Digital']));

      const result = await orchestrator.process({
        userMessage: '04121234567',
        conversationHistory: [{ role: 'user', text: 'Soy luis@email.com' }],
      });

      expect(result.answer).toContain('Alfabetizacion Digital');
      expect(ToolRegistry.prototype.executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        JSON.stringify({ email: 'luis@email.com', phone: '04121234567' })
      );
    });

    it('should return a GENERIC message (no PII, no existence leak) when not verified', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(NOT_VERIFIED);

      const result = await orchestrator.process({
        userMessage: 'Mi correo es ajeno@test.com, telefono 04120000000',
        conversationHistory: [],
      });

      expect(result.answer).toContain('No encontré inscripciones que coincidan');
      // No debe filtrar el correo consultado ni afirmar que existe.
      expect(result.answer).not.toContain('ajeno@test.com');
      expect(result.answer).not.toContain('Taller');
    });

    it('should ask for the phone again if the tool reports needs_phone', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(JSON.stringify({ status: 'needs_phone' }));

      const result = await orchestrator.process({
        userMessage: 'Mi correo es ana@test.com, telefono 04121234567',
        conversationHistory: [],
      });

      expect(result.answer.toLowerCase()).toContain('teléfono');
    });

    it('should surface a generic technical error (no PII) when the tool errors', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(JSON.stringify({ error: 'Connection timeout' }));

      const result = await orchestrator.process({
        userMessage: 'Mi correo es ana@test.com, telefono 04121234567',
        conversationHistory: [],
      });

      expect(result.answer).toContain('problema técnico');
      expect(result.answer).not.toContain('ana@test.com');
      expect(result.answer).not.toContain('Connection timeout');
    });

    it('should degrade gracefully when the tool returns a non-object result', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(JSON.stringify(null));

      const result = await orchestrator.process({
        userMessage: 'Mi correo es ana@test.com, telefono 04121234567',
        conversationHistory: [],
      });

      expect(result.answer).toContain('problema técnico');
    });
  });

  // ---------------------------------------------------------------------------
  describe('email extraction and normalization', () => {
    it('should normalize the email to lowercase before calling the tool', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(verified(['Taller A']));

      await orchestrator.process({
        userMessage: 'Cuales son mis cursos? mi telefono es 04121234567',
        conversationHistory: [
          { role: 'user', text: 'Mi correo es Juan@TEST.COM' },
          { role: 'assistant', text: 'Perfecto' },
        ],
      });

      expect(mockLLMProvider.generateAnswer).not.toHaveBeenCalled();
      expect(ToolRegistry.prototype.executeTool).toHaveBeenCalledWith(
        'consultar_inscripciones',
        expect.stringContaining('juan@test.com')
      );
    });

    it('should fall back to LLM (ask email) when no email is found', async () => {
      await orchestrator.process({ userMessage: 'No tengo correo', conversationHistory: [] });
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
    });

    it('should NOT treat an invalid email-like string as a valid email', async () => {
      await orchestrator.process({ userMessage: 'El usuario@no es valido', conversationHistory: [] });
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
      expect(ToolRegistry.prototype.executeTool).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('verification throttle (anti brute-force)', () => {
    const makeThrottle = (allowed: boolean) => ({
      check: vi.fn().mockResolvedValue(allowed ? { allowed: true } : { allowed: false, retryAfterSeconds: 600 }),
      recordFailure: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(undefined),
    });

    it('should block (without hitting the DB) when the email is throttled', async () => {
      const throttle = makeThrottle(false);
      const orch = new ChatOrchestrator(mockLLMProvider, mockRAGService, null, null, throttle as never);

      const result = await orch.process({
        userMessage: 'Mi correo es ana@test.com, telefono 04121234567',
        conversationHistory: [],
      });

      expect(result.answer.toLowerCase()).toContain('seguridad');
      expect(throttle.check).toHaveBeenCalledWith('ana@test.com');
      expect(ToolRegistry.prototype.executeTool).not.toHaveBeenCalled();
    });

    it('should reset the counter on a successful verification', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(verified(['Taller A']));
      const throttle = makeThrottle(true);
      const orch = new ChatOrchestrator(mockLLMProvider, mockRAGService, null, null, throttle as never);

      await orch.process({
        userMessage: 'Mi correo es ana@test.com, telefono 04121234567',
        conversationHistory: [],
      });

      expect(throttle.reset).toHaveBeenCalledWith('ana@test.com');
      expect(throttle.recordFailure).not.toHaveBeenCalled();
    });

    it('should record a failure when verification does not match', async () => {
      vi.spyOn(ToolRegistry.prototype, 'executeTool').mockResolvedValue(NOT_VERIFIED);
      const throttle = makeThrottle(true);
      const orch = new ChatOrchestrator(mockLLMProvider, mockRAGService, null, null, throttle as never);

      await orch.process({
        userMessage: 'Mi correo es ana@test.com, telefono 04120000000',
        conversationHistory: [],
      });

      expect(throttle.recordFailure).toHaveBeenCalledWith('ana@test.com');
      expect(throttle.reset).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('conversation history inclusion (catalog)', () => {
    it('should include system message + full history + new message in the LLM call', async () => {
      const shortHistory = [
        { role: 'user' as const, text: 'User message 1' },
        { role: 'assistant' as const, text: 'Assistant message 1' },
        { role: 'user' as const, text: 'User message 2' },
        { role: 'assistant' as const, text: 'Assistant message 2' },
      ];

      await orchestrator.process({ userMessage: 'Que cursos tienen?', conversationHistory: shortHistory });

      const calls = vi.mocked(mockLLMProvider.generateAnswer).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toHaveLength(6);
    });

    it('should only include system message and new message when history is empty', async () => {
      await orchestrator.process({ userMessage: 'Que cursos tienen?', conversationHistory: [] });

      const calls = vi.mocked(mockLLMProvider.generateAnswer).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  describe('intent classification routing', () => {
    it('should route a catalog query ("que cursos tienen") to RAG', async () => {
      await orchestrator.process({ userMessage: 'Que cursos tienen?', conversationHistory: [] });
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });

    it('should route a registration query without email through the LLM (asks for email)', async () => {
      await orchestrator.process({ userMessage: 'Cuales son mis cursos?', conversationHistory: [] });
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
      expect(mockLLMProvider.generateAnswer).toHaveBeenCalled();
    });

    it('should route "como me inscribo" as a catalog intent (future action, not registration)', async () => {
      await orchestrator.process({ userMessage: 'Como me inscribo en un taller?', conversationHistory: [] });
      expect(mockRAGService.retrieveContext).toHaveBeenCalled();
    });
  });
});
