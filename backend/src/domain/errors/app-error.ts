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
 * Wraps a Supabase error into an InternalServerError with structured logging.
 *
 * @param logger - The context logger to use
 * @param error - The Supabase error object
 * @param data - Additional data from the Supabase response
 * @param operation - Human-readable operation description (e.g., 'inserting contact message')
 */
export function handleSupabaseError(
  logger: { error: (ctx: Record<string, unknown>, msg: string) => void },
  error: unknown,
  data: unknown,
  operation: string
): never {
  logger.error(
    { supabaseError: error, responseData: data },
    `Database error while ${operation}`
  );
  throw new InternalServerError(`Error al ${operation}`);
}
