import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ENV mutable: el middleware lee ADMIN_SECRET en cada llamada, así que basta
// con reasignar la propiedad entre tests.
const mockEnv = vi.hoisted(() => ({ ADMIN_SECRET: undefined as string | undefined }));

vi.mock('../../config/env.config.js', () => ({
  get ENV() {
    return mockEnv;
  },
}));

vi.mock('../../infrastructure/logger/index.js', () => ({
  contextLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { requireAdminKey } from '../../middlewares/admin-auth.middleware.js';

// --- Helpers ------------------------------------------------------------------

const SECRET = 'clave-admin-super-secreta';

function buildReq(adminKey?: string | string[]): Request {
  return {
    headers: adminKey === undefined ? {} : { 'x-admin-key': adminKey },
    ip: '203.0.113.7',
    requestId: 'req-test',
  } as unknown as Request;
}

function buildRes() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

function expectUnauthorized(res: ReturnType<typeof buildRes>, next: NextFunction) {
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  expect(next).not.toHaveBeenCalled();
}

// --- Suite --------------------------------------------------------------------

describe('requireAdminKey', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.ADMIN_SECRET = SECRET;
    next = vi.fn();
  });

  describe('fail-closed', () => {
    it('rechaza con 401 cuando no viene el header x-admin-key', () => {
      const res = buildRes();
      requireAdminKey(buildReq(), res, next);
      expectUnauthorized(res, next);
    });

    it('rechaza con 401 cuando el header viene vacío', () => {
      const res = buildRes();
      requireAdminKey(buildReq(''), res, next);
      expectUnauthorized(res, next);
    });

    it('rechaza con 401 cuando ADMIN_SECRET no está configurado, aunque la petición traiga clave', () => {
      // Si el servidor no tiene secreto, ninguna clave puede ser válida: cerrar,
      // nunca abrir. Sin este guard, un despliegue sin ADMIN_SECRET quedaría abierto.
      mockEnv.ADMIN_SECRET = undefined;
      const res = buildRes();

      requireAdminKey(buildReq('cualquier-cosa'), res, next);

      expectUnauthorized(res, next);
    });

    it('rechaza con 401 cuando ADMIN_SECRET es una cadena vacía', () => {
      mockEnv.ADMIN_SECRET = '';
      const res = buildRes();

      requireAdminKey(buildReq(SECRET), res, next);

      expectUnauthorized(res, next);
    });
  });

  describe('comparación de la clave', () => {
    it('deja pasar la petición cuando la clave coincide exactamente', () => {
      const res = buildRes();

      requireAdminKey(buildReq(SECRET), res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rechaza una clave incorrecta de la misma longitud', () => {
      const res = buildRes();
      const impostora = 'clave-admin-super-secretX';
      expect(impostora).toHaveLength(SECRET.length);

      requireAdminKey(buildReq(impostora), res, next);

      expectUnauthorized(res, next);
    });

    it('rechaza una clave que es prefijo de la correcta', () => {
      // El hash SHA-256 iguala longitudes antes de timingSafeEqual, así que un
      // prefijo no puede provocar la excepción de longitud desigual.
      const res = buildRes();

      requireAdminKey(buildReq(SECRET.slice(0, 5)), res, next);

      expectUnauthorized(res, next);
    });

    it('rechaza una clave mucho más larga sin lanzar excepción', () => {
      const res = buildRes();

      expect(() => requireAdminKey(buildReq('x'.repeat(5000)), res, next)).not.toThrow();
      expectUnauthorized(res, next);
    });

    it('distingue mayúsculas y minúsculas', () => {
      const res = buildRes();

      requireAdminKey(buildReq(SECRET.toUpperCase()), res, next);

      expectUnauthorized(res, next);
    });

    it('no acepta el header duplicado como array aunque contenga la clave válida', () => {
      // Express entrega string[] si el header llega repetido. String(['a','b'])
      // produce "a,b", que no puede coincidir con el secreto.
      const res = buildRes();

      requireAdminKey(buildReq([SECRET, SECRET]), res, next);

      expectUnauthorized(res, next);
    });
  });
});
