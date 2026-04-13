import { createClient } from 'redis';
import { ENV } from '../../config/env.config.js';
import { logger } from '../logger/index.js';

const redisUrl = ENV.REDIS_URL || 'redis://localhost:6379';

// Redis Cloud requiere TLS (rediss://). Lo detectamos automáticamente.
const isTLS = redisUrl.startsWith('rediss://');

// En producción, validar certificados TLS es obligatorio para prevenir MITM.
// En desarrollo (localhost), se puede deshabilitar para conveniencia.
const isDevelopment = process.env.NODE_ENV !== 'production';
const isLocalhost = redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1');

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    // tls debe ser literalmente `true` (no `boolean`) para satisfacer RedisTlsOptions
    ...(isTLS && {
      tls: true as const,
      // Solo deshabilitar validación en desarrollo local. En producción SIEMPRE validar certificados.
      rejectUnauthorized: isDevelopment && isLocalhost ? false : true,
    }),
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        logger.warn({ retries }, 'Redis: máximo de reintentos alcanzado, operando sin caché.');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 200, 2000);
    },
  },
});

// Pino usa la firma: logger.method(obj, msg)
redisClient.on('error', (err) => logger.error({ error: err.message }, 'Redis error'));
redisClient.on('connect', () => logger.info({ tls: isTLS }, 'Redis conectado correctamente'));
redisClient.on('ready', () => logger.info('Redis listo para operar'));
redisClient.on('reconnecting', () => logger.warn('Redis reconectando...'));

export async function connectRedis(): Promise<void> {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    // No es fatal: el backend funciona sin caché con degradación elegante
    logger.warn({ error: (err as Error).message }, 'Redis no disponible, continuando sin caché');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
}


