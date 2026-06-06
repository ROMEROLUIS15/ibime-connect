import type { Request, Response, NextFunction } from 'express';
import { createHash, timingSafeEqual } from 'crypto';
import { ENV } from '../config/env.config.js';
import { contextLogger } from '../infrastructure/logger/index.js';

/**
 * Guard de autenticación para endpoints administrativos / sensibles.
 *
 * Compara el header `x-admin-key` contra ENV.ADMIN_SECRET usando hashes
 * SHA-256 de longitud fija + timingSafeEqual (evita ataques de temporización).
 *
 * Fail-closed: si falta la clave o ADMIN_SECRET no está configurado → 401.
 * Mismo criterio que el endpoint /admin/flush-cache.
 */
export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId;
  const logger = contextLogger(requestId);
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || !ENV.ADMIN_SECRET) {
    logger.warn(
      'Acceso no autorizado a endpoint protegido (credenciales ausentes)',
      { hasAdminKey: !!adminKey, hasAdminSecret: !!ENV.ADMIN_SECRET }
    );
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Comparación timing-safe usando hashes SHA-256 (longitud fija garantizada)
  const providedHash = createHash('sha256').update(String(adminKey)).digest();
  const expectedHash = createHash('sha256').update(ENV.ADMIN_SECRET).digest();

  if (!timingSafeEqual(providedHash, expectedHash)) {
    logger.warn('Intento no autorizado a endpoint protegido (clave inválida)', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}
