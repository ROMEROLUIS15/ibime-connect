import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmbeddingService } from '../../services/embedding.service.js';

// --- Suite --------------------------------------------------------------------

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    service = new EmbeddingService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getEmbedding — successful call', () => {
    it('should return the embedding values array from the Gemini API response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embedding: { values: [0.1, 0.2, 0.3] } }),
      });

      // Act
      const result = await service.getEmbedding('test text');

      // Assert
      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEmbedding — input validation', () => {
    it('should throw with message "Text cannot be empty" when input is an empty string', async () => {
      // Act & Assert — no network call should be made
      await expect(service.getEmbedding('')).rejects.toThrow('Text cannot be empty');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getEmbedding — API errors', () => {
    it('should throw with the HTTP status code when the Gemini API responds with a non-OK status', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      });

      // Act & Assert
      await expect(service.getEmbedding('test text')).rejects.toThrow('Gemini API Error (401)');
    });
  });

  describe('getEmbedding — network errors', () => {
    it('should propagate the original error when a network failure occurs', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(service.getEmbedding('test text')).rejects.toThrow('Network error');
    });
  });
});
