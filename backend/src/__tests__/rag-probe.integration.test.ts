import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

/**
 * POST /api/v1/admin/rag-probe (y su montaje legado /api/admin/rag-probe).
 * El servicio se espía: estos tests verifican cableado, auth y validación, no Gemini.
 *
 * ADMIN_SECRET = 'test-admin-secret' viene de vitest.config.ts.
 */

vi.mock('../infrastructure/cache/redis.js', () => ({
  get redisClient() {
    return { isOpen: false };
  },
}));

vi.mock('../config/supabase.config.js', () => ({
  supabaseClient: { from: vi.fn(), rpc: vi.fn() },
}));

import app from '../app.js';
import { RagProbeService, RAG_PROBE_DEFAULT_TOP_K, RAG_PROBE_MAX_QUESTIONS } from '../services/rag-probe.service.js';

const CLAVE_VALIDA = 'test-admin-secret';
const RUTAS: Array<[string]> = [['/api/v1/admin/rag-probe'], ['/api/admin/rag-probe']];

const REPORTE = {
  threshold: 0.65,
  topK: RAG_PROBE_DEFAULT_TOP_K,
  results: [{ question: '¿Cuál es el horario?', matches: [], best: null, margin: null, passesThreshold: false }],
  summary: { total: 1, passing: 0, failing: 1, errors: 0 },
};

describe('POST /admin/rag-probe (integración)', () => {
  let probeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    probeSpy = vi.spyOn(RagProbeService.prototype, 'probe').mockResolvedValue(REPORTE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(RUTAS)('%s responde 401 sin el header x-admin-key', async (ruta) => {
    const res = await request(app).post(ruta).send({ questions: ['hola'] });

    expect(res.status).toBe(401);
    expect(probeSpy).not.toHaveBeenCalled();
  });

  it.each(RUTAS)('%s responde 401 con una clave incorrecta', async (ruta) => {
    const res = await request(app).post(ruta).set('x-admin-key', 'clave-mala').send({ questions: ['hola'] });

    expect(res.status).toBe(401);
    expect(probeSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['sin questions', {}],
    ['questions vacío', { questions: [] }],
    ['una pregunta en blanco', { questions: ['   '] }],
    ['una pregunta demasiado larga', { questions: ['x'.repeat(501)] }],
    ['demasiadas preguntas', { questions: Array.from({ length: RAG_PROBE_MAX_QUESTIONS + 1 }, (_, i) => `p${i}`) }],
    ['topK fuera de rango', { questions: ['hola'], topK: 11 }],
  ])('responde 400 y no sondea con %s', async (_caso, body) => {
    const res = await request(app).post('/api/v1/admin/rag-probe').set('x-admin-key', CLAVE_VALIDA).send(body);

    expect(res.status).toBe(400);
    expect(probeSpy).not.toHaveBeenCalled();
  });

  it.each(RUTAS)('%s devuelve el reporte del sondeo con la clave correcta', async (ruta) => {
    const res = await request(app)
      .post(ruta)
      .set('x-admin-key', CLAVE_VALIDA)
      .send({ questions: ['  ¿Cuál es el horario?  '] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(REPORTE);
    // Las preguntas llegan recortadas y con el topK por defecto.
    expect(probeSpy).toHaveBeenCalledWith(['¿Cuál es el horario?'], RAG_PROBE_DEFAULT_TOP_K, expect.anything());
  });

  it('respeta el topK pedido', async () => {
    await request(app).post('/api/v1/admin/rag-probe').set('x-admin-key', CLAVE_VALIDA).send({ questions: ['hola'], topK: 3 });

    expect(probeSpy).toHaveBeenCalledWith(['hola'], 3, expect.anything());
  });
});
