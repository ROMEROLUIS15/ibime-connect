import { createClient } from 'redis';
import { ENV } from '../../config/env.config.js';
import { logger } from '../logger/index.js';

const redisUrl = ENV.REDIS_URL || 'redis://localhost:6379';

// TLS se activa automáticamente si la URL usa rediss:// (p. ej. un proveedor
// externo como Upstash). En producción usamos Render Key Value por su red interna
// privada (redis://), donde el tráfico no sale a internet y no requiere TLS.
const isTLS = redisUrl.startsWith('rediss://');

export interface RedisTlsInput {
  url: string;
  /** process.env.NODE_ENV */
  nodeEnv?: string;
  /** PEM del certificado CA del proveedor de Redis (env REDIS_CA_CERT). Opcional. */
  caCert?: string;
}

/**
 * Construye las opciones TLS del socket de Redis (función pura, testeable).
 *
 * - URL sin `rediss://` → sin TLS (objeto vacío).
 * - Con `rediss://`:
 *     - `rejectUnauthorized: true` SIEMPRE en producción (previene MITM). Solo se
 *       desactiva en desarrollo local (localhost), por conveniencia.
 *     - Si se provee `caCert` (REDIS_CA_CERT), se pasa como `ca` para validar el
 *       certificado del proveedor contra su CA propia. Soporta PEM con saltos de
 *       línea reales o escapados (`\n`), como suelen quedar en una env var.
 */
export function buildRedisTlsOptions(
  { url, nodeEnv, caCert }: RedisTlsInput,
): { tls: true; rejectUnauthorized: boolean; ca?: string } | Record<string, never> {
  if (!url.startsWith('rediss://')) return {};

  const isDevelopment = nodeEnv !== 'production';
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');

  const options: { tls: true; rejectUnauthorized: boolean; ca?: string } = {
    tls: true,
    rejectUnauthorized: isDevelopment && isLocalhost ? false : true,
  };

  if (caCert && caCert.trim() !== '') {
    options.ca = caCert.replace(/\\n/g, '\n');
  }

  return options;
}

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    ...buildRedisTlsOptions({ url: redisUrl, nodeEnv: process.env.NODE_ENV, caCert: ENV.REDIS_CA_CERT }),
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


