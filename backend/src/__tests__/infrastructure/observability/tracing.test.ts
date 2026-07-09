import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Estos sanitizadores son lo único que impide que la PII del usuario salga
 * hacia LangSmith, un tercero. No están exportados, así que se ejercitan a
 * través de wrapLLM/wrapChain capturando los callbacks que reciben `traceable`.
 * De paso queda probado el cableado: qué sanitizador usa cada wrapper.
 */

// --- Mocks de langsmith -------------------------------------------------------

const traceableSpy = vi.hoisted(() => vi.fn());
const ClientSpy = vi.hoisted(() => vi.fn());

vi.mock('langsmith', () => ({
  Client: ClientSpy,
}));

vi.mock('langsmith/traceable', () => ({
  traceable: traceableSpy,
}));

// --- Helpers ------------------------------------------------------------------

const WRAPPED = Symbol('wrapped');

type TracingModule = typeof import('../../../infrastructure/observability/tracing.js');

/**
 * Recarga tracing.ts con un ENV concreto. Necesario porque getClient() cachea
 * el cliente en una variable de módulo: sin resetModules, el primer test fijaría
 * el cliente para todos los demás.
 */
async function loadTracing(env: Record<string, unknown>): Promise<TracingModule> {
  vi.resetModules();
  vi.doMock('../../../config/env.config.js', () => ({ ENV: env }));
  return import('../../../infrastructure/observability/tracing.js');
}

const ENABLED = { LANGSMITH_API_KEY: 'ls-test-key', LANGSMITH_TRACING: true };

/** Devuelve las `options` con las que se llamó a traceable en la última envoltura. */
function lastTraceableOptions(): any {
  return traceableSpy.mock.calls.at(-1)?.[1];
}

// --- Suite --------------------------------------------------------------------

describe('tracing (observabilidad LangSmith)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    traceableSpy.mockReturnValue(WRAPPED);
  });

  describe('degradación elegante', () => {
    it('devuelve la función original sin envolver cuando falta LANGSMITH_API_KEY', async () => {
      const { wrapLLM } = await loadTracing({ LANGSMITH_TRACING: true });
      const fn = async () => 'ok';

      expect(wrapLLM(fn, 'llm')).toBe(fn);
      expect(traceableSpy).not.toHaveBeenCalled();
      expect(ClientSpy).not.toHaveBeenCalled();
    });

    it('devuelve la función original cuando LANGSMITH_TRACING está desactivado', async () => {
      const { wrapChain } = await loadTracing({ LANGSMITH_API_KEY: 'ls-k', LANGSMITH_TRACING: false });
      const fn = async () => 'ok';

      expect(wrapChain(fn, 'chain')).toBe(fn);
      expect(traceableSpy).not.toHaveBeenCalled();
    });

    it('reutiliza el mismo cliente entre llamadas (se instancia una sola vez)', async () => {
      const { wrapLLM, wrapChain } = await loadTracing(ENABLED);

      wrapLLM(async () => 'a', 'llm');
      wrapChain(async () => 'b', 'chain');

      expect(ClientSpy).toHaveBeenCalledTimes(1);
      expect(ClientSpy).toHaveBeenCalledWith({ apiKey: 'ls-test-key' });
    });
  });

  describe('wrapLLM', () => {
    it('envuelve con run_type "llm" y propaga nombre y metadata', async () => {
      const { wrapLLM } = await loadTracing(ENABLED);

      const result = wrapLLM(async () => 'x', 'groq.generateAnswer', { flow: 'general' });

      expect(result).toBe(WRAPPED);
      expect(lastTraceableOptions()).toMatchObject({
        name: 'groq.generateAnswer',
        run_type: 'llm',
        metadata: { flow: 'general' },
      });
    });

    it('sustituye los mensajes del prompt por su recuento, sin filtrar su contenido', async () => {
      const { wrapLLM } = await loadTracing(ENABLED);
      wrapLLM(async () => 'x', 'llm');

      const messages = [
        { role: 'system', content: 'Eres el asistente del IBIME' },
        { role: 'user', content: 'Mi correo es luis@ejemplo.com y mi telefono 0414-1234567' },
      ];
      const sanitized = lastTraceableOptions().processInputs([messages, { temperature: 0.3 }]);

      expect(sanitized).toEqual({ messageCount: 2, options: { temperature: 0.3 } });

      const serialized = JSON.stringify(sanitized);
      expect(serialized).not.toContain('luis@ejemplo.com');
      expect(serialized).not.toContain('0414-1234567');
    });

    it('deja pasar los inputs tal cual cuando no son un array', async () => {
      const { wrapLLM } = await loadTracing(ENABLED);
      wrapLLM(async () => 'x', 'llm');
      const { processInputs } = lastTraceableOptions();

      expect(processInputs(null)).toBeNull();
      expect(processInputs(undefined)).toBeUndefined();
    });

    it('cuenta 0 mensajes cuando el primer argumento no es un array', async () => {
      const { wrapLLM } = await loadTracing(ENABLED);
      wrapLLM(async () => 'x', 'llm');

      expect(lastTraceableOptions().processInputs([undefined, { a: 1 }]))
        .toEqual({ messageCount: 0, options: { a: 1 } });
    });

    it('reduce la salida a métricas y nunca emite el texto generado', async () => {
      const { wrapLLM } = await loadTracing(ENABLED);
      wrapLLM(async () => 'x', 'llm');

      const sanitized = lastTraceableOptions().processOutputs({
        content: 'El horario de Luis es de 8am',
        tokensUsed: 1512,
        model: 'openai/gpt-oss-20b',
        toolCalls: [{ name: 'check_registration' }],
      });

      expect(sanitized).toEqual({
        tokensUsed: 1512,
        model: 'openai/gpt-oss-20b',
        hasToolCalls: true,
        contentLength: 'El horario de Luis es de 8am'.length,
      });
      expect(JSON.stringify(sanitized)).not.toContain('Luis');
    });

    it('marca hasToolCalls=false y contentLength=0 cuando no hay contenido ni tools', async () => {
      const { wrapLLM } = await loadTracing(ENABLED);
      wrapLLM(async () => 'x', 'llm');

      expect(lastTraceableOptions().processOutputs({ tokensUsed: 0, model: 'm' }))
        .toEqual({ tokensUsed: 0, model: 'm', hasToolCalls: false, contentLength: 0 });
    });

    it('deja pasar una salida vacía sin tocarla', async () => {
      const { wrapLLM } = await loadTracing(ENABLED);
      wrapLLM(async () => 'x', 'llm');

      expect(lastTraceableOptions().processOutputs(null)).toBeNull();
    });
  });

  describe('wrapChain', () => {
    it('envuelve con run_type "chain"', async () => {
      const { wrapChain } = await loadTracing(ENABLED);

      expect(wrapChain(async () => 'x', 'chat.orchestrate')).toBe(WRAPPED);
      expect(lastTraceableOptions()).toMatchObject({ name: 'chat.orchestrate', run_type: 'chain' });
    });

    it('sustituye un input posicional de tipo string por su longitud', async () => {
      // Este es el guard que impide filtrar el mensaje crudo del usuario o un PDF
      // entero: los sub-handlers reciben el texto como string, no como objeto.
      const { wrapChain } = await loadTracing(ENABLED);
      wrapChain(async () => 'x', 'chain');

      const crudo = 'Soy Luis, luis@ejemplo.com, 0414-1234567';
      const sanitized = lastTraceableOptions().processInputs([crudo]);

      expect(sanitized).toEqual({ inputLength: crudo.length });
      expect(JSON.stringify(sanitized)).not.toContain('luis@ejemplo.com');
    });

    it('reduce un objeto con userMessage a longitudes, sin el mensaje ni el historial', async () => {
      const { wrapChain } = await loadTracing(ENABLED);
      wrapChain(async () => 'x', 'chain');

      const sanitized = lastTraceableOptions().processInputs([{
        userMessage: 'mi telefono es 0414-1234567',
        conversationHistory: [{ role: 'user', text: 'hola' }, { role: 'assistant', text: 'buenas' }],
      }]);

      expect(sanitized).toEqual({ userMessageLength: 27, historyLength: 2 });
      expect(JSON.stringify(sanitized)).not.toContain('0414-1234567');
    });

    it('reduce un objeto con rawText a su longitud (PDF completo)', async () => {
      const { wrapChain } = await loadTracing(ENABLED);
      wrapChain(async () => 'x', 'chain');

      const sanitized = lastTraceableOptions().processInputs([{ rawText: 'contenido del pdf' }]);

      expect(sanitized).toEqual({ textLength: 17 });
    });

    it('devuelve un objeto vacío para un objeto sin campos conocidos', async () => {
      const { wrapChain } = await loadTracing(ENABLED);
      wrapChain(async () => 'x', 'chain');

      expect(lastTraceableOptions().processInputs([{ algoInesperado: 'valor' }])).toEqual({});
    });

    it('envuelve un input no-array bajo la clave input', async () => {
      const { wrapChain } = await loadTracing(ENABLED);
      wrapChain(async () => 'x', 'chain');

      expect(lastTraceableOptions().processInputs(null)).toEqual({ input: null });
    });

    it('respeta un processInputs propio en lugar del sanitizador por defecto', async () => {
      const { wrapChain } = await loadTracing(ENABLED);
      const custom = vi.fn(() => ({ custom: true }));

      wrapChain(async () => 'x', 'chain', undefined, custom);
      const out = lastTraceableOptions().processInputs(['lo que sea']);

      expect(custom).toHaveBeenCalledWith(['lo que sea']);
      expect(out).toEqual({ custom: true });
    });

    it('no fija processOutputs: las cadenas emiten su salida sin sanitizar', async () => {
      // Documenta la asimetría con wrapLLM. Si algún día una cadena devuelve PII,
      // este test es el que hay que cambiar (y añadir el sanitizador).
      const { wrapChain } = await loadTracing(ENABLED);
      wrapChain(async () => 'x', 'chain');

      expect(lastTraceableOptions().processOutputs).toBeUndefined();
    });
  });
});
