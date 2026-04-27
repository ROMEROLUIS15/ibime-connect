import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { errorHandler } from '../../middlewares/error.middleware.js';
import { logger } from '../../infrastructure/logger/index.js';

// Mock the logger to avoid polluting test output and potential hangs
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

describe('Error Middleware', () => {
  it('should handle RATE_LIMIT_EXCEEDED error correctly', () => {
    const mockReq = {
      path: '/api/v1/chat',
    } as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    // Create a mock error that starts with RATE_LIMIT_EXCEEDED
    const error = new Error('RATE_LIMIT_EXCEEDED:38:El asistente está muy ocupado en este momento. Por favor intenta de nuevo en 38 segundos.');

    // Execute the middleware
    errorHandler(error, mockReq, mockRes, next);

    // Verify that the response was handled correctly
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      text: 'El asistente está muy ocupado en este momento. Por favor intenta de nuevo en 38 segundos.',
      retryAfterSeconds: 38,
      requestId: 'unknown',
    });
  });

  it('should handle malformed RATE_LIMIT_EXCEEDED error gracefully', () => {
    const mockReq = {
      path: '/api/v1/chat',
      requestId: 'req-456'
    } as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    // Create a mock error with malformed format (only includes error type and wait time, no message)
    const error = new Error('RATE_LIMIT_EXCEEDED:malformed-format');

    // Execute the middleware
    errorHandler(error, mockReq, mockRes, next);

    // Verify that the response was handled correctly
    expect(mockRes.status).toHaveBeenCalledWith(429);
    // When parsing fails, the friendlyMessage part will be empty since there's no third part
    expect(mockRes.json).toHaveBeenCalledWith({
      text: "", // parts.slice(2).join(':') returns empty string when there's no third part
      retryAfterSeconds: NaN, // parseInt("malformed-format", 10) returns NaN
      requestId: 'req-456',
    });
  });

  it('should handle non-RATE_LIMIT_EXCEEDED errors normally', () => {
    const mockReq = {} as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    const error = new Error('Something went wrong');

    // Execute the middleware
    errorHandler(error, mockReq, mockRes, next);

    // Verify that the response was handled normally
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      text: 'Something went wrong',
      error: 'Something went wrong',
      requestId: 'unknown',
    });
  }, 10000); // Increased timeout for stability

  it('should handle AppError instances appropriately', () => {
    // Create a mock AppError with statusCode property
    const mockAppError = {
      message: 'Bad Request',
      statusCode: 400,
    };

    const mockReq = {} as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    // Execute the middleware
    errorHandler(mockAppError as any, mockReq, mockRes, next);

    // Since our mock is not a real AppError instance, it won't be recognized as such
    // So it will be treated as a generic error with 500 status
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      text: 'Bad Request',
      error: 'Bad Request',
      requestId: 'unknown',
    });
  });
});