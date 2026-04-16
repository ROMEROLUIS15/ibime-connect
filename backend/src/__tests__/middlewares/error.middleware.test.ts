import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { errorHandler } from '../../middlewares/error.middleware.js';

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

    // Create a mock error with malformed format
    const error = new Error('RATE_LIMIT_EXCEEDED:malformed-format');

    // Execute the middleware
    errorHandler(error, mockReq, mockRes, next);

    // Verify that the response was handled correctly
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      text: 'El asistente está muy ocupado. Por favor intenta en un momento.',
      retryAfterSeconds: 60, // Default to 60 when parsing fails
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
      error: undefined, // In production mode, error details are hidden
      requestId: 'unknown',
    });
  });

  it('should handle AppError instances appropriately', () => {
    // We'll create a simple mock AppError since we don't have the actual class here
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

    // Verify that the response was handled with the AppError's status code
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      text: 'Bad Request',
      error: undefined, // In production mode, error details are hidden
      requestId: 'unknown',
    });
  });
});