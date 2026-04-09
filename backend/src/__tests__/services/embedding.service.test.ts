import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddingService } from '../../services/embedding.service.js';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService();
    vi.clearAllMocks();
  });

  it('should generate embedding for valid text', async () => {
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: { values: [0.1, 0.2, 0.3] } }),
    });

    const result = await service.getEmbedding('test');
    expect(result).toEqual([0.1, 0.2, 0.3]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw on empty text', async () => {
    await expect(service.getEmbedding('')).rejects.toThrow('Text cannot be empty');
  });

  it('should handle API errors', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key',
    });

    await expect(service.getEmbedding('test')).rejects.toThrow('Gemini API Error (401)');
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    await expect(service.getEmbedding('test')).rejects.toThrow('Network error');
  });
});
