import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

vi.mock('../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));

// --- Suite --------------------------------------------------------------------

describe('API Integration', () => {
  describe('root endpoint', () => {
    it('should return 200 with a status OK payload confirming the backend is running', async () => {
      // Act
      const response = await request(app).get('/');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'OK', message: 'ibime-backend is running' });
    });

    it('should apply helmet security headers to responses', async () => {
      const response = await request(app).get('/');

      // helmet activo: nosniff siempre presente; X-Powered-By eliminado.
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('health check endpoint', () => {
    it('should return 200 with database:connected and a valid ISO timestamp when Supabase is reachable', async () => {
      // Act
      const response = await request(app).get('/health');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'OK',
        database: 'connected',
        timestamp: expect.any(String),
      });
    });
  });

  describe('proxy configuration', () => {
    it('should trust the Render proxy so req.ip is the real client IP (rate-limiting depends on it)', () => {
      // Guard contra que alguien quite app.set('trust proxy'): sin esto el
      // rate-limiting por IP se rompe detrás del proxy de Render.
      expect(app.get('trust proxy')).toBe(1);
    });
  });

  describe('unknown routes', () => {
    it('should return 404 for unregistered route paths', async () => {
      // Act
      const response = await request(app).get('/invalid-route');

      // Assert
      expect(response.status).toBe(404);
    });
  });
});
