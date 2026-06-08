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

  describe('unknown routes', () => {
    it('should return 404 for unregistered route paths', async () => {
      // Act
      const response = await request(app).get('/invalid-route');

      // Assert
      expect(response.status).toBe(404);
    });
  });
});
