import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

/**
 * Integración del endpoint de chat a través de la app real (rutas + validación +
 * middleware de errores). Solo se sustituye ChatService: lo que se prueba aquí es
 * el contrato HTTP, no la orquestación del LLM.
 */

const processChat = vi.hoisted(() => vi.fn());

vi.mock('../infrastructure/di/container.js', () => ({
  default: { resolve: () => ({ processChat }) },
}));

vi.mock('../config/supabase.config.js', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }),
    }),
  },
}));

import app from '../app.js';

const RESPUESTA = { answer: 'El horario es de 8am a 4pm.', sources: [], tokensUsed: 1512 };

describe('POST /api/v1/chat (integración)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processChat.mockResolvedValue(RESPUESTA);
  });

  describe('contrato de la petición', () => {
    it('devuelve 200 con la respuesta del servicio', async () => {
      const res = await request(app).post('/api/v1/chat').send({ userMessage: '¿Cuál es el horario?' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(RESPUESTA);
      expect(processChat).toHaveBeenCalledWith(
        expect.objectContaining({ userMessage: '¿Cuál es el horario?' }),
        expect.any(String)
      );
    });

    it('sigue atendiendo la ruta legacy /api/chat', async () => {
      const res = await request(app).post('/api/chat').send({ userMessage: 'hola' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(RESPUESTA);
    });

    it('acepta el formato messages[] y lo traduce a userMessage + historial', async () => {
      const res = await request(app).post('/api/v1/chat').send({
        messages: [
          { role: 'user', text: 'hola' },
          { role: 'assistant', text: 'buenas' },
          { role: 'user', text: '¿horario?' },
        ],
      });

      expect(res.status).toBe(200);
      expect(processChat).toHaveBeenCalledWith(
        expect.objectContaining({
          userMessage: '¿horario?',
          conversationHistory: [
            { role: 'user', text: 'hola' },
            { role: 'assistant', text: 'buenas' },
          ],
        }),
        expect.any(String)
      );
    });

    it('rechaza con 400 un cuerpo sin userMessage', async () => {
      const res = await request(app).post('/api/v1/chat').send({});

      expect(res.status).toBe(400);
      expect(res.body.text).toBe('Datos de consulta inválidos.');
      expect(processChat).not.toHaveBeenCalled();
    });

    it('rechaza con 400 un sessionId que no es UUID', async () => {
      const res = await request(app)
        .post('/api/v1/chat')
        .send({ userMessage: 'hola', sessionId: 'no-soy-un-uuid' });

      expect(res.status).toBe(400);
      expect(processChat).not.toHaveBeenCalled();
    });

    it('expone un X-Request-ID en la respuesta', async () => {
      const res = await request(app).post('/api/v1/chat').send({ userMessage: 'hola' });

      expect(res.headers['x-request-id']).toBeTruthy();
    });
  });

  describe('cuota de Groq agotada', () => {
    it('traduce el límite por minuto a 429 con el segundos de espera', async () => {
      processChat.mockRejectedValue(
        new Error('RATE_LIMIT_EXCEEDED:12:El asistente está muy ocupado en este momento. Por favor intenta de nuevo en 12 segundos.')
      );

      const res = await request(app).post('/api/v1/chat').send({ userMessage: 'hola' });

      expect(res.status).toBe(429);
      expect(res.body.retryAfterSeconds).toBe(12);
      expect(res.body.text).toContain('muy ocupado');
      expect(res.body.requestId).toBeTruthy();
    });

    it('traduce la cuota DIARIA a 429 pidiendo volver mañana, no en N segundos', async () => {
      // La distinción importa: el TPD es el límite que realmente aprieta (~132
      // respuestas/día) y no se recupera en segundos, sino a medianoche UTC.
      processChat.mockRejectedValue(
        new Error('RATE_LIMIT_EXCEEDED:40000:El asistente alcanzó su cuota de consultas por hoy. Por favor intenta de nuevo mañana.')
      );

      const res = await request(app).post('/api/v1/chat').send({ userMessage: 'hola' });

      expect(res.status).toBe(429);
      expect(res.body.text).toContain('mañana');
      expect(res.body.text).not.toMatch(/en \d+ segundos/);
      expect(res.body.retryAfterSeconds).toBe(40000);
    });

    it('conserva los dos puntos del mensaje amigable al despiezar el error', async () => {
      // El formato es "RATE_LIMIT_EXCEEDED:{seg}:{mensaje}" y el mensaje puede
      // contener ':'; el handler rearma con slice(2).join(':').
      processChat.mockRejectedValue(new Error('RATE_LIMIT_EXCEEDED:5:Espera: casi listo'));

      const res = await request(app).post('/api/v1/chat').send({ userMessage: 'hola' });

      expect(res.body.text).toBe('Espera: casi listo');
    });
  });

  describe('errores inesperados', () => {
    it('devuelve 500 y no filtra el stack', async () => {
      processChat.mockRejectedValue(new Error('Supabase se cayó'));

      const res = await request(app).post('/api/v1/chat').send({ userMessage: 'hola' });

      expect(res.status).toBe(500);
      expect(res.body.requestId).toBeTruthy();
      expect(JSON.stringify(res.body)).not.toContain('at ');
    });
  });
});
