import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('API Integration', () => {
  it('should respond with 200 to GET /', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK', message: 'ibime-backend is running' });
  });

  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    // In tests, it might return 500 if Supabase is not configured, 
    // but the structure should be consistent.
    expect([200, 500]).toContain(response.status);
    expect(response.body).toMatchObject({
      status: expect.any(String),
      database: expect.any(String),
      timestamp: expect.any(String)
    });
  });

  it('should handle invalid routes', async () => {
    const response = await request(app).get('/invalid-route');
    
    expect(response.status).toBe(404);
  });

  // Temporarily skip rate limiting tests as they require Redis
  it.skip('should apply rate limiting to chat endpoints', async () => {
    // Make multiple requests to test rate limiting
    // This is just checking that the route exists and is protected by rate limiting
    
    // First request should succeed (with valid payload)
    const response1 = await request(app)
      .post('/api/v1/chat')
      .send({
        userMessage: 'Hello',
        conversationHistory: []
      });
    
    // Should return 400 due to validation (not rate limiting) as it passes the rate limiter
    expect(response1.status).toBeGreaterThanOrEqual(400);
    expect(response1.status).toBeLessThan(500);
  });

  it.skip('should apply rate limiting to legacy chat endpoint', async () => {
    // Test the legacy route as well
    const response = await request(app)
      .post('/api/chat')
      .send({
        userMessage: 'Hello',
        conversationHistory: []
      });
    
    // Should return 400 due to validation (not rate limiting) as it passes the rate limiter
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });
});