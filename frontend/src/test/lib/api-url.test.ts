import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('api-url utilities', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('apiFetch', () => {
    it('should return success with data on 200 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ answer: 'Hola', sources: [] }),
      });

      const { apiFetch } = await import('../../lib/api-url.js');
      const result = await apiFetch<{ answer: string; sources: unknown[] }>('chat', {
        method: 'POST',
        body: JSON.stringify({ userMessage: 'Hola' }),
      });

      expect(result).toEqual({
        ok: true,
        data: { answer: 'Hola', sources: [] },
      });
    });

    it('should return error object on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: { get: () => null },
        json: async () => ({ text: 'Datos inválidos' }),
      });

      const { apiFetch } = await import('../../lib/api-url.js');
      const result = await apiFetch('contact', { method: 'POST', body: '{}' });

      expect(result).toEqual({ ok: false, error: 'Datos inválidos' });
    });

    it('should return fallback error when response is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => null },
        json: async () => { throw new Error('Not JSON'); },
      });

      const { apiFetch } = await import('../../lib/api-url.js');
      const result = await apiFetch('chat', { method: 'POST', body: '{}' });

      expect(result).toEqual({ ok: false, error: 'Error de conexión. Intenta de nuevo.' });
    });

    it('should return fallback error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

      const { apiFetch } = await import('../../lib/api-url.js');
      const result = await apiFetch('chat', { method: 'POST', body: '{}' });

      expect(result).toEqual({ ok: false, error: 'Error de conexión. Intenta de nuevo.' });
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: { get: () => null },
      });

      const { apiFetch } = await import('../../lib/api-url.js');
      const result = await apiFetch<void>('contact', { method: 'POST', body: '{}' });

      expect(result.ok).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should handle empty response (content-length 0)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: (name: string) => name === 'content-length' ? '0' : null },
        json: async () => ({ ok: true }),
      });

      const { apiFetch } = await import('../../lib/api-url.js');
      const result = await apiFetch<void>('test', { method: 'POST', body: '{}' });

      expect(result.ok).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should merge Content-Type header with custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ data: 'ok' }),
      });

      const { apiFetch } = await import('../../lib/api-url.js');
      await apiFetch('test', {
        method: 'POST',
        headers: { 'X-Custom': 'value' } as Record<string, string>,
        body: '{}',
      });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/json');
      expect(callArgs.headers['X-Custom']).toBe('value');
    });

    it('should use custom fallback error message', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fail'));

      const { apiFetch } = await import('../../lib/api-url.js');
      const result = await apiFetch('test', { method: 'POST' }, 'Servidor no disponible');

      expect(result).toEqual({ ok: false, error: 'Servidor no disponible' });
    });
  });
});
