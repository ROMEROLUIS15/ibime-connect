import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  handleSupabaseError,
} from '../../../domain/errors/app-error.js';

describe('AppError classes', () => {
  describe('AppError base', () => {
    it('should default to status 500 and isOperational true', () => {
      const err = new AppError('Test error');
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
      expect(err.message).toBe('Test error');
      expect(err.name).toBe('AppError');
    });

    it('should accept custom status code', () => {
      const err = new AppError('Custom', 418);
      expect(err.statusCode).toBe(418);
    });

    it('should capture stack trace', () => {
      const err = new AppError('Test');
      expect(err.stack).toBeDefined();
      expect(err.stack).toContain('AppError');
    });
  });

  describe('BadRequestError', () => {
    it('should have status 400', () => {
      const err = new BadRequestError('Bad request');
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Bad request');
    });
  });

  describe('UnauthorizedError', () => {
    it('should have status 401 and default message', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('No autorizado');
    });

    it('should accept custom message', () => {
      const err = new UnauthorizedError('Token expired');
      expect(err.message).toBe('Token expired');
    });
  });

  describe('ForbiddenError', () => {
    it('should have status 403 and default message', () => {
      const err = new ForbiddenError();
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Acceso denegado');
    });
  });

  describe('NotFoundError', () => {
    it('should have status 404 and default message', () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Recurso no encontrado');
    });

    it('should accept custom resource name', () => {
      const err = new NotFoundError('Usuario');
      expect(err.message).toBe('Usuario no encontrado');
    });
  });

  describe('RateLimitError', () => {
    it('should have status 429 and fixed message', () => {
      const err = new RateLimitError();
      expect(err.statusCode).toBe(429);
      expect(err.message).toBe('Demasiadas solicitudes. Por favor intenta más tarde.');
    });
  });

  describe('InternalServerError', () => {
    it('should have status 500 and isOperational false', () => {
      const err = new InternalServerError();
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(false);
    });

    it('should accept custom message', () => {
      const err = new InternalServerError('Database connection failed');
      expect(err.message).toBe('Database connection failed');
    });
  });

  describe('handleSupabaseError', () => {
    it('should log error and throw InternalServerError', () => {
      const mockLogger = { error: vi.fn() };
      const supabaseError = { message: 'Constraint violation', code: '23505' };
      const data = { email: 'test@test.com' };

      expect(() => handleSupabaseError(mockLogger, supabaseError, data, 'inserting user')).toThrow(
        InternalServerError
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        { supabaseError, responseData: data },
        'Database error while inserting user'
      );
    });

    it('should include operation description in error message', () => {
      const mockLogger = { error: vi.fn() };

      expect(() =>
        handleSupabaseError(mockLogger, {}, {}, 'finding registrations by email')
      ).toThrow('Error al finding registrations by email');
    });

    it('should never return (type is never)', () => {
      const mockLogger = { error: vi.fn() };

      try {
        handleSupabaseError(mockLogger, {}, {}, 'test');
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerError);
        return;
      }

      throw new Error('Should have thrown');
    });
  });
});
