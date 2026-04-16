import { Request, Response, NextFunction } from 'express';
import { contextLogger } from '../infrastructure/logger/index.js';
import { AppError, InternalServerError } from '../domain/errors/app-error.js';

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

