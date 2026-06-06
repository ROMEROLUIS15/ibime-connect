import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import app from '../app.js';
import type { ILLMProvider } from '../domain/interfaces/index.js';

// Mock Supabase para evitar llamadas reales a base de datos en tests de integración
vi.mock('../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        in: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    })
  }
}));

// Debe coincidir con ADMIN_SECRET inyectado en vitest.config.ts (test.env)
const ADMIN_KEY = 'test-admin-secret';

describe('Agent HTTP API Integration', () => {
  let mockLLMProvider: ILLMProvider;

  beforeEach(() => {
    mockLLMProvider = {
      generateAnswer: vi.fn().mockResolvedValue({
        content: JSON.stringify([
          {
            title: "Curso de Fotografía Digital",
            category: "curso",
            content: "Un curso completo sobre composición y manejo de cámaras réflex.",
            keyDetails: "Lunes de 6pm a 8pm"
          }
        ]),
        tokensUsed: 120,
        model: 'llama-3.1-8b-instant'
      })
    };

    // Sobrescribimos el LLMProvider en el contenedor global de dependencias para los tests
    container.registerInstance('ILLMProvider', mockLLMProvider);
  });

  it('debería retornar 401 si no se envía la clave admin', async () => {
    const response = await request(app)
      .post('/api/v1/agents/curate-catalog')
      .send({ text: 'Texto de prueba del catálogo de fotografía' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('debería retornar 400 si el body no contiene texto para analizar', async () => {
    const response = await request(app)
      .post('/api/v1/agents/curate-catalog')
      .set('x-admin-key', ADMIN_KEY)
      .send({ text: '' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Debe proveer el texto');
  });

  it('debería retornar 200 y el JSON estructurado si el texto es correcto', async () => {
    const response = await request(app)
      .post('/api/v1/agents/curate-catalog')
      .set('x-admin-key', ADMIN_KEY)
      .send({ text: 'Texto de prueba del catálogo de fotografía' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      iterations: 1,
      conflicts: [],
      items: [
        {
          title: "Curso de Fotografía Digital",
          category: "curso",
          content: "Un curso completo sobre composición y manejo de cámaras réflex.",
          keyDetails: "Lunes de 6pm a 8pm"
        }
      ]
    });
  });

  it('debería aplicar el límite de tasa de curación y retornar 429 cuando se superan las 5 peticiones por minuto', async () => {
    const originalEnv = process.env.NODE_ENV;
    // Forzamos temporalmente a que el skip del rate limiter sea falso (simulando producción)
    process.env.NODE_ENV = 'production';

    // Realizamos 5 llamadas consecutivas exitosas
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/agents/curate-catalog')
        .set('x-admin-key', ADMIN_KEY)
        .send({ text: `Texto de prueba de tasa ${i} para el limitador` });
      expect(res.status).toBe(200);
    }

    // La sexta petición consecutiva debe ser rechazada con HTTP 429
    const response6 = await request(app)
      .post('/api/v1/agents/curate-catalog')
      .set('x-admin-key', ADMIN_KEY)
      .send({ text: 'Petición número 6' });

    expect(response6.status).toBe(429);
    expect(response6.body.error).toContain('Demasiadas solicitudes');

    // Restauramos el entorno de test
    process.env.NODE_ENV = originalEnv;
  });
});
