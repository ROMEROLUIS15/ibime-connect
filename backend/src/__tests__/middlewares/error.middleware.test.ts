import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middlewares/error.middleware.js';
import { AppError, BadRequestError, NotFoundError, InternalServerError } from '../../domain/errors/app-error.js';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/test',
    ...overrides,
  } as unknown as Request;
}

function mockRes(): { res: Response; json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> } {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  return {
    res: { status, json } as unknown as Response,
    json,
    status,
  };
}

describe('errorHandler middleware', () => {
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with AppError subclasses', () => {
    it('should return correct status code for BadRequestError', () => {
      const { res, status, json } = mockRes();
      const err = new BadRequestError('Invalid input');

      errorHandler(err, mockReq(), res, next);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Invalid input', requestId: 'unknown' })
      );
    });

    it('should return 404 for NotFoundError', () => {
      const { res, status, json } = mockRes();
      const err = new NotFoundError('Usuario');

      errorHandler(err, mockReq(), res, next);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Usuario no encontrado' })
      );
    });

    it('should return 500 for InternalServerError', () => {
      const { res, status, json } = mockRes();
      const err = new InternalServerError();

      errorHandler(err, mockReq(), res, next);

      expect(status).toHaveBeenCalledWith(500);
    });

    it('should include error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { res, json } = mockRes();
      const err = new AppError('Detailed error message', 500);

      errorHandler(err, mockReq(), res, next);

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Detailed error message' })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { res, json } = mockRes();
      const err = new Error('Sensitive internal message');

      errorHandler(err, mockReq(), res, next);

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: undefined,
          text: expect.stringContaining('error interno'),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('with generic Error', () => {
    it('should return 500 for unknown errors', () => {
      const { res, status, json } = mockRes();
      const err = new Error('Something went wrong');

      errorHandler(err, mockReq(), res, next);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Something went wrong' })
      );
    });

    it('should include requestId in response', () => {
      const { res, json } = mockRes();
      const req = { ...mockReq(), requestId: 'req-123' } as unknown as Request;
      const err = new Error('fail');

      errorHandler(err, req, res, next);

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'req-123' })
      );
    });

    it('should use "unknown" requestId when not present', () => {
      const { res, json } = mockRes();
      const err = new Error('fail');

      errorHandler(err, mockReq(), res, next);

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'unknown' })
      );
    });
  });

  describe('with non-Error objects', () => {
    it('should handle string errors', () => {
      const { res, status, json } = mockRes();
      const err = 'Something failed' as unknown as Error;

      errorHandler(err, mockReq(), res, next);

      expect(status).toHaveBeenCalledWith(500);
    });
  });
});
