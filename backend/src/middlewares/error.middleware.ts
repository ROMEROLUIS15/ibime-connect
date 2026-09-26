import { Request, Response, NextFunction } from 'express';
import { contextLogger } from '../infrastructure/logger/index.js';
import { AppError, InternalServerError } from '../domain/errors/app-error.js';
import { captureError } from '../infrastructure/observability/sentry.js';

/**
 * Error de cliente que lanza el parser de cuerpos de Express (body-parser, vía
 * http-errors): cuerpo sobre el límite (413), JSON malformado (400), charset no
 * soportado (415)… Trae `expose: true` y un `status` 4xx.
 */
interface ExposedClientError extends Error {
  status: number;
  expose: true;
  type?: string;
  limit?: number;
}

const isExposedClientError = (err: Error): err is ExposedClientError => {
  const candidate = err as Partial<ExposedClientError>;
  return (
    candidate.expose === true &&
    typeof candidate.status === 'number' &&
    candidate.status >= 400 &&
    candidate.status < 500
  );
};

const clientErrorMessage = (err: ExposedClientError): string => {
  if (err.type === 'entity.too.large') {
    const limit = typeof err.limit === 'number' ? ` (${Math.round(err.limit / 1024)} KB)` : '';
    return `La solicitud supera el tamaño máximo permitido${limit}.`;
  }
  if (err.type === 'entity.parse.failed') {
    return 'El cuerpo de la solicitud no es un JSON válido.';
  }
  return 'La solicitud no es válida.';
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId || 'unknown';
  const logger = contextLogger(requestId);
  const isProduction = process.env.NODE_ENV === 'production';

  // ── Rate limit exceeded (thrown by GroqProvider) ──────────────────────────
  // Format: "RATE_LIMIT_EXCEEDED:{waitSec}:{friendlyMessage}"
  if (err.message?.startsWith('RATE_LIMIT_EXCEEDED:')) {
    const parts = err.message.split(':');
    const waitSec = parts[1] ?? '60';
    const friendlyMessage = parts.slice(2).join(':');
    logger.warn(
      'Rate limit response sent to client',
      { waitSec, path: req.path }
    );
    return res.status(429).json({
      text: friendlyMessage,
      retryAfterSeconds: parseInt(waitSec, 10),
      requestId,
    });
  }

  // ── Errores de cliente del parser de cuerpos (413, 400, 415…) ─────────────
  // Son 4xx esperados, no incidentes: se registran como warn y no van a Sentry.
  if (isExposedClientError(err)) {
    logger.warn('Request rejected by body parser', {
      status: err.status,
      type: err.type,
      method: req.method,
      path: req.path,
    });
    return res.status(err.status).json({
      text: clientErrorMessage(err),
      requestId,
    });
  }

  // Log full details server-side for debugging
  logger.error('Unhandled error in request', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  // Determine if this is a known operational error
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? (err as AppError).statusCode : 500;

  // Reportar a Sentry SOLO los errores no operativos (500 reales). Los 4xx
  // esperados (validación, not found) y los 429 de rate-limit (return arriba)
  // no son incidentes. No-op si Sentry está deshabilitado.
  if (!isOperational) {
    captureError(err, { requestId, method: req.method, path: req.path });
  }

  // Client response: never expose internal error messages in production
  const clientError = isOperational
    ? (err as AppError).message
    : isProduction
      ? 'Lo sentimos, ha ocurrido un error interno. Por favor intenta de nuevo más tarde.'
      : err.message;

  res.status(statusCode).json({
    text: clientError,
    error: isProduction ? undefined : err.message,
    requestId,
  });
};

