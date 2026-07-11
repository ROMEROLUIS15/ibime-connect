import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import app from '../app.js';
import type { ILLMProvider } from '../domain/interfaces/index.js';

vi.mock('../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));

const ADMIN_KEY = 'test-admin-secret';

// Fixture: a valid LLM response that passes CurationGraph schema validation
const CURATED_ITEM = {
  title: 'Curso de Fotografia Digital',
  category: 'curso',
  content: 'Un curso completo sobre composicion y manejo de camaras reflex.',
  keyDetails: 'Lunes de 6pm a 8pm',
};

// --- Suite --------------------------------------------------------------------

describe('Agent HTTP API Integration', () => {
  let mockLLMProvider: ILLMProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLLMProvider = {
      generateAnswer: vi.fn().mockResolvedValue({
        content: JSON.stringify([CURATED_ITEM]),
        tokensUsed: 120,
        model: 'openai/gpt-oss-20b',
      }),
    };

    container.registerInstance('ILLMProvider', mockLLMProvider);
  });

  afterEach(() => {
    container.clearInstances();
    vi.unstubAllEnvs();
  });

  describe('authentication guard', () => {
    it('should return 401 when no admin key is provided', async () => {
      // Arrange
      const payload = { text: 'Texto de prueba del catalogo' };

      // Act
      const response = await request(app)
        .post('/api/v1/agents/curate-catalog')
        .send(payload);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('input validation', () => {
    it('should return 400 with a descriptive error when the body text is empty', async () => {
      // Arrange
      const payload = { text: '' };

      // Act
      const response = await request(app)
        .post('/api/v1/agents/curate-catalog')
        .set('x-admin-key', ADMIN_KEY)
        .send(payload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Debe proveer el texto');
    });
  });

  describe('successful curation', () => {
    it('should return 200 with a structured curation report when the input text is valid', async () => {
      // Arrange
      const payload = { text: 'Texto de prueba del catalogo de fotografia' };

      // Act
      const response = await request(app)
        .post('/api/v1/agents/curate-catalog')
        .set('x-admin-key', ADMIN_KEY)
        .send(payload);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        iterations: 1,
        conflicts: [],
        items: [CURATED_ITEM],
      });
    });
  });

  describe('rate limiting', () => {
    it('should return 429 after exceeding 5 requests per minute in production mode', async () => {
      /**
       * Rate limiting is only active in production.
       * We stub NODE_ENV=production and exhaust the 5-req/min allowance,
       * then verify the 6th request is rejected.
       *
       * NOTE: The rate limiter uses express-rate-limit with an in-memory store.
       * Each test run gets a fresh store because container.clearInstances() resets the app state.
       */
      // Arrange
      vi.stubEnv('NODE_ENV', 'production');

      // Act — exhaust the 5-request allowance
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/v1/agents/curate-catalog')
          .set('x-admin-key', ADMIN_KEY)
          .send({ text: `Texto de prueba de tasa ${i} para el limitador` });
        expect(res.status).toBe(200);
      }

      // Act — 6th request should be rate-limited
      const response6 = await request(app)
        .post('/api/v1/agents/curate-catalog')
        .set('x-admin-key', ADMIN_KEY)
        .send({ text: 'Peticion numero 6' });

      // Assert
      expect(response6.status).toBe(429);
      expect(response6.body.error).toContain('Demasiadas solicitudes');
    });
  });
});
