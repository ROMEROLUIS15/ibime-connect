import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

/**
 * Verifica que el guard de admin está realmente cableado a las rutas sensibles.
 * Un unitario de requireAdminKey no detectaría que alguien lo quita de un router.
 *
 * ADMIN_SECRET = 'test-admin-secret' viene de vitest.config.ts.
 */

const mockRedisClient = vi.hoisted(() => ({
  isOpen: false, // cache caída: clear() es un no-op y no necesitamos Redis real
  get: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn(),
  flushDb: vi.fn(),
}));

vi.mock('../infrastructure/cache/redis.js', () => ({
  get redisClient() {
    return mockRedisClient;
  },
}));

vi.mock('../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }),
    }),
  },
}));

import app from '../app.js';

const CLAVE_VALIDA = 'test-admin-secret';

/** Rutas que jamás deben responder sin una x-admin-key válida. */
const RUTAS_PROTEGIDAS: Array<[string, string]> = [
  ['post', '/api/v1/knowledge/upload-pdf'],
  ['post', '/api/v1/knowledge/webhook/koha'],
];

describe('Endpoints administrativos (integración)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient.isOpen = false;
  });

  describe('POST /api/admin/flush-cache', () => {
    it('responde 401 sin el header x-admin-key', async () => {
      const res = await request(app).post('/api/admin/flush-cache');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });

    it('responde 401 con una clave incorrecta', async () => {
      const res = await request(app).post('/api/admin/flush-cache').set('x-admin-key', 'clave-mala');

      expect(res.status).toBe(401);
    });

    it('vacía la caché con la clave correcta', async () => {
      mockRedisClient.isOpen = true;

      const res = await request(app).post('/api/admin/flush-cache').set('x-admin-key', CLAVE_VALIDA);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Cache flushed' });
      expect(mockRedisClient.flushDb).toHaveBeenCalledOnce();
    });

    it('el GET ya no está expuesto (405/404)', async () => {
      const res = await request(app).get('/api/admin/flush-cache').set('x-admin-key', CLAVE_VALIDA);

      expect(res.status).not.toBe(200);
    });
  });

  describe('rutas de ingesta protegidas', () => {
    it.each(RUTAS_PROTEGIDAS)('%s %s responde 401 sin clave', async (metodo, ruta) => {
      const res = await (request(app) as any)[metodo](ruta).send({});

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });

    it.each(RUTAS_PROTEGIDAS)('%s %s responde 401 con clave incorrecta', async (metodo, ruta) => {
      const res = await (request(app) as any)[metodo](ruta).set('x-admin-key', 'no-soy-la-clave').send({});

      expect(res.status).toBe(401);
    });

    it('el guard corre antes de parsear el archivo en upload-pdf', async () => {
      // Rechazar temprano evita que un atacante sin credenciales nos haga leer
      // 10 MB de multipart en memoria.
      const res = await request(app)
        .post('/api/v1/knowledge/upload-pdf')
        .attach('file', Buffer.from('%PDF-1.4 falso'), 'malicioso.pdf');

      expect(res.status).toBe(401);
    });
  });
});
