import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { errorHandler } from '../../middlewares/error.middleware.js';
import { BadRequestError } from '../../domain/errors/app-error.js';
import { captureError } from '../../infrastructure/observability/sentry.js';

vi.mock('../../infrastructure/logger/index.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  contextLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../../infrastructure/observability/sentry.js', () => ({
  captureError: vi.fn(),
}));

// --- Helpers ------------------------------------------------------------------

function makeReq(overrides = {}) {
  return { path: '/api/v1/test', ...overrides } as Request;
}

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { mock: { status, json } as unknown as Response, status, json };
}

// --- Suite --------------------------------------------------------------------

describe('ErrorMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RATE_LIMIT_EXCEEDED protocol', () => {
    it('should respond 429 with parsed wait time and friendly message when well-formed', () => {
      // Arrange
      const req = makeReq({ path: '/api/v1/chat' });
      const { mock: res, status, json } = makeRes();
      const next = vi.fn();
      const err = new Error(
        'RATE_LIMIT_EXCEEDED:38:El asistente esta muy ocupado. Por favor intenta de nuevo en 38 segundos.'
      );

      // Act
      errorHandler(err, req, res, next);

      // Assert
      expect(status).toHaveBeenCalledWith(429);
      expect(json).toHaveBeenCalledWith({
        text: 'El asistente esta muy ocupado. Por favor intenta de nuevo en 38 segundos.',
        retryAfterSeconds: 38,
        requestId: 'unknown',
      });
    });

    it('should respond 429 preserving requestId from request when RATE_LIMIT_EXCEEDED is malformed', () => {
      // Arrange
      const req = makeReq({ requestId: 'req-456' });
      const { mock: res, status, json } = makeRes();
      const next = vi.fn();
      const err = new Error('RATE_LIMIT_EXCEEDED:malformed-format');

      // Act
      errorHandler(err, req, res, next);

      // Assert
      expect(status).toHaveBeenCalledWith(429);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'req-456' })
      );
    });
  });

  describe('generic Error (non-AppError, non-rate-limit)', () => {
    it('should respond 500 and expose message in non-production environment', () => {
      // Arrange
      const req = makeReq();
      const { mock: res, status, json } = makeRes();
      const next = vi.fn();
      const err = new Error('Something went wrong');

      // Act
      errorHandler(err, req, res, next);

      // Assert
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Something went wrong',
          requestId: 'unknown',
        })
      );
    });
  });

  describe('Sentry error reporting', () => {
    it('should report non-operational 500 errors to Sentry with safe context only', () => {
      const req = makeReq({ requestId: 'req-500', method: 'POST', path: '/api/v1/chat' });
      const { mock: res } = makeRes();
      const err = new Error('boom');

      errorHandler(err, req, res, vi.fn());

      expect(captureError).toHaveBeenCalledWith(err, {
        requestId: 'req-500',
        method: 'POST',
        path: '/api/v1/chat',
      });
    });

    it('should NOT report operational AppError (4xx) to Sentry — no es un incidente', () => {
      const req = makeReq();
      const { mock: res } = makeRes();

      errorHandler(new BadRequestError('dato inválido'), req, res, vi.fn());

      expect(captureError).not.toHaveBeenCalled();
    });

    it('should NOT report RATE_LIMIT_EXCEEDED (429) to Sentry', () => {
      const req = makeReq({ path: '/api/v1/chat' });
      const { mock: res } = makeRes();

      errorHandler(new Error('RATE_LIMIT_EXCEEDED:30:espera'), req, res, vi.fn());

      expect(captureError).not.toHaveBeenCalled();
    });
  });

  describe('plain object passed as error (not instanceof AppError)', () => {
    it('should respond 500 because a plain object fails the instanceof AppError check', () => {
      /**
       * The middleware checks err instanceof AppError to determine the status code.
       * A plain object like { message, statusCode } is NOT an AppError instance,
       * so the middleware correctly defaults to 500 — this is expected behavior.
       */
      // Arrange
      const fakeError = { message: 'Bad Request', statusCode: 400 };
      const req = makeReq();
      const { mock: res, status } = makeRes();
      const next = vi.fn();

      // Act
      errorHandler(fakeError as any, req, res, next);

      // Assert
      expect(status).toHaveBeenCalledWith(500);
    });
  });
});
