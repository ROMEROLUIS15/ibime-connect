import { maskPiiInText } from '../../utils/pii.util.js';

/**
 * Base class for application errors.
 * Allows precise HTTP status codes and avoids exposing internal details to clients.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Demasiadas solicitudes. Por favor intenta más tarde.', 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Error interno del servidor') {
    super(message, 500, false); // Non-operational: hide details from client
  }
}

/**
 * Keeps only what identifies a database failure, without personal data.
 * Postgres echoes the offending values in `details` ("Failing row contains (…)",
 * "Key (email, …)=(…)"), so it is dropped; `message` and `hint` are masked.
 */
function sanitizeDbError(error: unknown): Record<string, unknown> {
  if (typeof error !== 'object' || error === null) {
    return { message: maskPiiInText(String(error)) };
  }
  const { code, message, hint } = error as { code?: unknown; message?: unknown; hint?: unknown };
  const sanitized: Record<string, unknown> = {};
  if (code !== undefined) sanitized.code = code;
  if (message !== undefined) sanitized.message = typeof message === 'string' ? maskPiiInText(message) : message;
  if (hint !== undefined && hint !== null) sanitized.hint = typeof hint === 'string' ? maskPiiInText(hint) : hint;
  return sanitized;
}

/**
 * Wraps a Supabase error into an InternalServerError with structured logging.
 *
 * @param logger - A pino-style logger (`error(obj, msg)`), e.g. `logger.child({ requestId })`
 * @param error - The Supabase error object (logged without `details`, masked)
 * @param context - Safe context for the log. Never the raw user input: mask it first (see pii.util)
 * @param operation - Human-readable operation description (e.g., 'inserting contact message')
 */
export function handleSupabaseError(
  logger: { error: (ctx: Record<string, unknown>, msg: string) => void },
  error: unknown,
  context: Record<string, unknown>,
  operation: string
): never {
  logger.error(
    { supabaseError: sanitizeDbError(error), context },
    `Database error while ${operation}`
  );
  throw new InternalServerError(`Error al ${operation}`);
}
