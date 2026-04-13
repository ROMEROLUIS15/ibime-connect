import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('API Integration Tests', () => {

  describe('GET /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
    });
  });

  describe('POST /api/chat', () => {
    it('should return 400 if userMessage is missing', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ conversationHistory: [] });
      expect(response.status).toBe(400);
      expect(response.body.text).toContain('consulta inválidos');
    });

    // Nota: El test del flujo feliz requiere llaves de API reales o mocks profundos.
    // Por ahora validamos que el controlador atrapa errores de validación.
  });

  describe('POST /api/registrations', () => {
    it('should return 400 if phone is invalid', async () => {
      const response = await request(app)
        .post('/api/registrations')
        .send({
          name: 'Test',
          email: 'test@test.com',
          phone: '123', // Muy corto
          courseName: 'Test Course'
        });
      expect(response.status).toBe(400);
    });
  });
});
