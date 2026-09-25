import { redisClient } from './redis.js';
import { contextLogger } from '../logger/index.js';

export interface ICacheService {
  get<T>(key: string, requestId?: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number, requestId?: string): Promise<void>;
  del(key: string, requestId?: string): Promise<void>;
  deleteByPrefix(prefix: string, requestId?: string): Promise<number>;
  clear(requestId?: string): Promise<void>;
}

export class CacheService implements ICacheService {
  private static readonly DEFAULT_TTL = 3600;

  async get<T>(key: string, requestId?: string): Promise<T | null> {
    const logger = contextLogger(requestId);

    try {
      if (!redisClient.isOpen) return null;

      const cached = await redisClient.get(key);
      if (!cached) {
        logger.debug('Cache miss', { key });
        return null;
      }

      const parsed = JSON.parse(cached) as T;
      logger.debug('Cache hit', { key });
      return parsed;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number, requestId?: string): Promise<void> {
    const logger = contextLogger(requestId);
    const ttl = ttlSeconds ?? CacheService.DEFAULT_TTL;

    try {
      if (!redisClient.isOpen) return;

      await redisClient.setEx(key, ttl, JSON.stringify(value));
      logger.debug('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  async del(key: string, requestId?: string): Promise<void> {
    const logger = contextLogger(requestId);

    try {
      if (!redisClient.isOpen) return;

      await redisClient.del(key);
      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Cache del error', { key, error });
    }
  }

  /**
   * Borra solo las claves que empiezan por `prefix` (SCAN + DEL por lotes, sin
   * bloquear Redis). A diferencia de clear(), no toca el resto de la base, donde
   * viven las sesiones, el throttle de verificación y los contadores de cuota.
   * Devuelve cuántas claves se borraron (0 si Redis no está disponible o falla).
   */
  async deleteByPrefix(prefix: string, requestId?: string): Promise<number> {
    const logger = contextLogger(requestId);

    try {
      if (!redisClient.isOpen) return 0;

      let deleted = 0;
      // node-redis 5: cada iteración entrega el lote de claves de un SCAN.
      for await (const keys of redisClient.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
        if (keys.length > 0) deleted += await redisClient.del(keys);
      }

      logger.info('Cache keys deleted by prefix', { prefix, deleted });
      return deleted;
    } catch (error) {
      logger.error('Cache deleteByPrefix error', { prefix, error });
      return 0;
    }
  }

  async clear(requestId?: string): Promise<void> {
    const logger = contextLogger(requestId);

    try {
      if (!redisClient.isOpen) return;

      await redisClient.flushDb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error', { error });
    }
  }
}
