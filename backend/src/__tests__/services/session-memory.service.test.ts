import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedisClient = vi.hoisted(() => ({
  get: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../../infrastructure/cache/redis.js', () => ({
  get redisClient() {
    return mockRedisClient;
  },
}));

vi.mock('../../infrastructure/logger/index.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { SessionMemoryService } from '../../services/session-memory.service.js';

const SESSION_ID = '7b3f1a4e-0d2c-4a91-8f6e-2c5b9d1e4a77';
const KEY = `ibime:session:${SESSION_ID}`;
const TTL = 1800; // 30 minutos

describe('SessionMemoryService', () => {
  let memory: SessionMemoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    memory = new SessionMemoryService();
  });

  describe('sessionId inválido', () => {
    // El Privacy Gate consulta esta capa: una sesión sin id no debe leer ni
    // escribir el contexto de otra.
    it.each([['', 'cadena vacía'], ['   ', 'solo espacios']])(
      'ignora un sessionId %s (%s) sin tocar Redis',
      async (id) => {
        await memory.saveSessionContext(id, { firstEmail: 'a@b.com' });
        await memory.clearSession(id);

        expect(await memory.getSessionContext(id)).toBeNull();
        expect(mockRedisClient.setEx).not.toHaveBeenCalled();
        expect(mockRedisClient.get).not.toHaveBeenCalled();
        expect(mockRedisClient.del).not.toHaveBeenCalled();
      }
    );
  });

  describe('getSessionContext', () => {
    it('devuelve el contexto deserializado', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ firstEmail: 'luis@ibime.gob.ve' }));

      await expect(memory.getSessionContext(SESSION_ID)).resolves.toEqual({ firstEmail: 'luis@ibime.gob.ve' });
      expect(mockRedisClient.get).toHaveBeenCalledWith(KEY);
    });

    it('devuelve null cuando la sesión no existe', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await expect(memory.getSessionContext(SESSION_ID)).resolves.toBeNull();
    });

    it('devuelve null cuando el contenido está corrupto, sin propagar', async () => {
      mockRedisClient.get.mockResolvedValue('{ roto');

      await expect(memory.getSessionContext(SESSION_ID)).resolves.toBeNull();
    });

    it('devuelve null cuando Redis está caído (modo degradado)', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(memory.getSessionContext(SESSION_ID)).resolves.toBeNull();
    });
  });

  describe('saveSessionContext', () => {
    it('persiste con el prefijo de clave y un TTL de 30 minutos', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await memory.saveSessionContext(SESSION_ID, { firstEmail: 'a@b.com' });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(KEY, TTL, JSON.stringify({ firstEmail: 'a@b.com' }));
    });

    it('fusiona con el contexto existente en vez de sobreescribirlo', async () => {
      // Sin el merge, guardar el sentimiento del turno borraría el firstEmail
      // del que depende el Privacy Gate.
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ firstEmail: 'a@b.com', userName: 'Luis' }));

      await memory.saveSessionContext(SESSION_ID, { textSentiment: 'frustrated' });

      const guardado = JSON.parse(mockRedisClient.setEx.mock.calls[0][2]);
      expect(guardado).toEqual({ firstEmail: 'a@b.com', userName: 'Luis', textSentiment: 'frustrated' });
    });

    it('los campos nuevos ganan sobre los existentes', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ textSentiment: 'neutral' }));

      await memory.saveSessionContext(SESSION_ID, { textSentiment: 'angry' });

      expect(JSON.parse(mockRedisClient.setEx.mock.calls[0][2])).toEqual({ textSentiment: 'angry' });
    });

    it('no propaga el fallo de Redis (no bloquea el flujo de chat)', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockRejectedValue(new Error('OOM'));

      await expect(memory.saveSessionContext(SESSION_ID, { userName: 'Luis' })).resolves.toBeUndefined();
    });
  });

  describe('clearSession', () => {
    it('borra la clave de la sesión', async () => {
      await memory.clearSession(SESSION_ID);

      expect(mockRedisClient.del).toHaveBeenCalledWith(KEY);
    });

    it('no propaga el fallo de Redis', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('boom'));

      await expect(memory.clearSession(SESSION_ID)).resolves.toBeUndefined();
    });
  });
});
