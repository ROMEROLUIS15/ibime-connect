import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedisClient = vi.hoisted(() => ({
  isOpen: true,
  get: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn(),
  flushDb: vi.fn(),
  scanIterator: vi.fn(),
}));

/** node-redis 5: scanIterator devuelve un lote de claves por cada SCAN. */
async function* scanBatches(...batches: string[][]) {
  for (const batch of batches) yield batch;
}

vi.mock('../../../infrastructure/cache/redis.js', () => ({
  get redisClient() {
    return mockRedisClient;
  },
}));

vi.mock('../../../infrastructure/logger/index.js', () => ({
  contextLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { CacheService } from '../../../infrastructure/cache/cache.service.js';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient.isOpen = true;
    cache = new CacheService();
  });

  describe('degradación cuando Redis está caído', () => {
    beforeEach(() => {
      mockRedisClient.isOpen = false;
    });

    it('get devuelve null sin consultar a Redis', async () => {
      await expect(cache.get('k')).resolves.toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it('set no intenta escribir', async () => {
      await cache.set('k', { a: 1 });
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
    });

    it('del no intenta borrar', async () => {
      await cache.del('k');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('clear no intenta vaciar', async () => {
      await cache.clear();
      expect(mockRedisClient.flushDb).not.toHaveBeenCalled();
    });

    it('deleteByPrefix no intenta escanear y devuelve 0', async () => {
      await expect(cache.deleteByPrefix('rag:')).resolves.toBe(0);
      expect(mockRedisClient.scanIterator).not.toHaveBeenCalled();
    });
  });

  describe('deleteByPrefix (RAG-07)', () => {
    it('borra lote a lote solo las claves del prefijo y devuelve cuántas borró', async () => {
      mockRedisClient.scanIterator.mockReturnValue(scanBatches(['rag:a', 'rag:b'], [], ['rag:c']));
      mockRedisClient.del.mockImplementation(async (keys: string[]) => keys.length);

      await expect(cache.deleteByPrefix('rag:')).resolves.toBe(3);
      expect(mockRedisClient.scanIterator).toHaveBeenCalledWith(expect.objectContaining({ MATCH: 'rag:*' }));
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledWith(['rag:a', 'rag:b']);
      expect(mockRedisClient.del).toHaveBeenCalledWith(['rag:c']);
    });

    it('nunca vacía la base completa (sesiones, throttle y cuotas viven en la misma DB)', async () => {
      mockRedisClient.scanIterator.mockReturnValue(scanBatches(['rag:a']));
      mockRedisClient.del.mockResolvedValue(1);

      await cache.deleteByPrefix('rag:');

      expect(mockRedisClient.flushDb).not.toHaveBeenCalled();
    });

    it('no propaga el error si el SCAN falla y devuelve 0', async () => {
      mockRedisClient.scanIterator.mockImplementation(() => {
        throw new Error('ECONNRESET');
      });

      await expect(cache.deleteByPrefix('rag:')).resolves.toBe(0);
    });
  });

  describe('get', () => {
    it('deserializa el valor cacheado', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ chunks: 3 }));

      await expect(cache.get<{ chunks: number }>('rag:abc')).resolves.toEqual({ chunks: 3 });
      expect(mockRedisClient.get).toHaveBeenCalledWith('rag:abc');
    });

    it('devuelve null en un miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await expect(cache.get('ausente')).resolves.toBeNull();
    });

    it('devuelve null (sin propagar) cuando el valor cacheado no es JSON válido', async () => {
      mockRedisClient.get.mockResolvedValue('{ esto no es json');

      await expect(cache.get('corrupto')).resolves.toBeNull();
    });

    it('devuelve null cuando Redis lanza', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('ECONNRESET'));

      await expect(cache.get('k')).resolves.toBeNull();
    });

    it('trata una cadena vacía como miss', async () => {
      mockRedisClient.get.mockResolvedValue('');

      await expect(cache.get('k')).resolves.toBeNull();
    });
  });

  describe('set', () => {
    it('serializa el valor y aplica el TTL por defecto de 1 hora', async () => {
      await cache.set('k', { a: 1 });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith('k', 3600, JSON.stringify({ a: 1 }));
    });

    it('respeta un TTL explícito', async () => {
      await cache.set('embedding:x', [0.1, 0.2], 86400);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith('embedding:x', 86400, '[0.1,0.2]');
    });

    it('no propaga el error si Redis falla al escribir', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('OOM'));

      await expect(cache.set('k', 'v')).resolves.toBeUndefined();
    });
  });

  describe('del y clear', () => {
    it('del borra la clave indicada', async () => {
      await cache.del('rag:abc');

      expect(mockRedisClient.del).toHaveBeenCalledWith('rag:abc');
    });

    it('clear vacía la base completa', async () => {
      await cache.clear();

      expect(mockRedisClient.flushDb).toHaveBeenCalledOnce();
    });

    it('no propaga los errores de del ni de clear', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('boom'));
      mockRedisClient.flushDb.mockRejectedValue(new Error('boom'));

      await expect(cache.del('k')).resolves.toBeUndefined();
      await expect(cache.clear()).resolves.toBeUndefined();
    });
  });
});
