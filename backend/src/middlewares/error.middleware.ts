import { Request, Response, NextFunction } from 'express';
import { contextLogger } from '../infrastructure/logger/index.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId || 'unknown';
  const logger = contextLogger(requestId);

  logger.error('Unhandled error in request', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  res.status(500).json({
    text: 'Lo siento, hubo un problema. Por favor intenta de nuevo o llama al 0274-2623898.',
    error: err.message || 'Error interno del servidor',
    requestId,
  });
};
