/**
 * VerificationThrottleService — Límite anti-fuerza-bruta por correo.
 *
 * Como la verificación de propiedad usa el teléfono como secreto, un atacante
 * con un correo conocido podría intentar adivinar el teléfono. Este throttle
 * cuenta los intentos FALLIDOS de verificación por correo y bloquea cuando se
 * supera el umbral dentro de una ventana de tiempo.
 *
 * Complementa (no reemplaza) el rate-limit por IP del router: ese limita el
 * volumen por origen; este limita los intentos contra un correo concreto aunque
 * el atacante rote IPs.
 *
 * Diseño:
 *   - Backed por Redis (INCR + EXPIRE). Clave = hash del correo (no PII en claro).
 *   - Degradación elegante: si Redis no está disponible, NO bloquea el flujo
 *     (fail-open). El control es defensa en profundidad, no la barrera principal
 *     (esa es la verificación por teléfono, que no depende de Redis).
 */

import { injectable, singleton } from 'tsyringe';
import { createHash } from 'crypto';
import { redisClient } from '../infrastructure/cache/redis.js';
import { logger } from '../infrastructure/logger/index.js';

const KEY_PREFIX = 'ibime:verify-throttle:';

/** Máximo de intentos fallidos por correo dentro de la ventana. */
const MAX_FAILED_ATTEMPTS = 5;

/** Ventana de bloqueo en segundos (15 minutos). */
const WINDOW_SECONDS = 60 * 15;

export interface ThrottleResult {
  allowed: boolean;
  /** Segundos hasta que se libere el bloqueo (solo cuando allowed = false). */
  retryAfterSeconds?: number;
}

export interface IVerificationThrottleService {
  check(email: string): Promise<ThrottleResult>;
  recordFailure(email: string): Promise<void>;
  reset(email: string): Promise<void>;
}

@injectable()
@singleton()
export class VerificationThrottleService implements IVerificationThrottleService {
  private buildKey(email: string): string {
    const hash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32);
    return `${KEY_PREFIX}${hash}`;
  }

  /** ¿Se permite intentar una verificación para este correo? */
  async check(email: string): Promise<ThrottleResult> {
    if (!email?.trim()) return { allowed: true };

    try {
      const key = this.buildKey(email);
      const raw = await redisClient.get(key);
      const attempts = raw ? parseInt(raw, 10) : 0;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const ttl = await redisClient.ttl(key);
        return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS };
      }

      return { allowed: true };
    } catch (err) {
      // Fail-open: Redis caído no debe romper la verificación legítima.
      logger.warn(
        { error: (err as Error).message },
        'VerificationThrottle: check falló — operando en modo degradado (fail-open)'
      );
      return { allowed: true };
    }
  }

  /** Registra un intento fallido y arma/renueva la ventana de expiración. */
  async recordFailure(email: string): Promise<void> {
    if (!email?.trim()) return;

    try {
      const key = this.buildKey(email);
      const attempts = await redisClient.incr(key);
      // Solo en el primer fallo fijamos el TTL para que la ventana sea deslizante
      // desde el primer intento (no se renueva indefinidamente con cada fallo).
      if (attempts === 1) {
        await redisClient.expire(key, WINDOW_SECONDS);
      }
    } catch (err) {
      logger.warn(
        { error: (err as Error).message },
        'VerificationThrottle: recordFailure falló — modo degradado'
      );
    }
  }

  /** Limpia el contador tras una verificación exitosa. */
  async reset(email: string): Promise<void> {
    if (!email?.trim()) return;

    try {
      await redisClient.del(this.buildKey(email));
    } catch (err) {
      logger.warn(
        { error: (err as Error).message },
        'VerificationThrottle: reset falló — modo degradado'
      );
    }
  }
}
