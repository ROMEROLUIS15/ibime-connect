import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock para redisClient
const mockRedisClient = vi.hoisted(() => ({
  isOpen: true,
  get: vi.fn(),
  incr: vi.fn(),
  incrBy: vi.fn(),
  expire: vi.fn(),
}));

vi.mock('../../../infrastructure/cache/redis.js', () => ({
  get redisClient() {
    return mockRedisClient;
  },
}));

// Importar después del mock
import { GroqRateLimiter } from '../../../infrastructure/providers/groq-rate-limiter.js';

describe('GroqRateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 16, 12, 0, 0));
    // Reset isOpen since some tests mutate it
    mockRedisClient.isOpen = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create an instance correctly', () => {
    const rateLimiter = new GroqRateLimiter();
    expect(rateLimiter).toBeInstanceOf(GroqRateLimiter);
  });

  it('should have correct default limits accessible via static properties', () => {
    expect(GroqRateLimiter.TPM_LIMIT).toBe(4800);
    expect(GroqRateLimiter.RPM_LIMIT).toBe(24);
  });

  describe('canProceed', () => {
    it('should allow request when under limit', async () => {
      const rateLimiter = new GroqRateLimiter();
      
      // Mock para simular que el contador actual es menor que el límite
      mockRedisClient.get.mockResolvedValue('5');

      const result = await rateLimiter.canProceed();

      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });

    it('should deny request when over TPM limit', async () => {
      const rateLimiter = new GroqRateLimiter();
      
      // Mock para simular que el contador actual supera el límite
      mockRedisClient.get.mockResolvedValue('5000');

      const result = await rateLimiter.canProceed();

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('tpm');
    });

    it('should deny request when over RPM limit', async () => {
      const rateLimiter = new GroqRateLimiter();
      
      // Mock para simular que el contador actual supera el límite
      mockRedisClient.get.mockResolvedValueOnce('5') // TPM check
                           .mockResolvedValue('30'); // RPM check

      const result = await rateLimiter.canProceed();

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('rpm');
    });

    it('should fail open when Redis is closed', async () => {
      // Simular que Redis está cerrado
      Object.defineProperty(mockRedisClient, 'isOpen', {
        value: false,
        writable: true,
      });
      
      const rateLimiter = new GroqRateLimiter();
      const result = await rateLimiter.canProceed();

      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });
  });

  describe('recordUsage', () => {
    it('should record token usage correctly', async () => {
      const rateLimiter = new GroqRateLimiter();
      const tokensUsed = 100;
      
      // Mock para las operaciones de Redis
      mockRedisClient.incrBy.mockResolvedValue(Promise.resolve());
      mockRedisClient.incr.mockResolvedValue(Promise.resolve());
      mockRedisClient.expire.mockResolvedValue(Promise.resolve());

      await rateLimiter.recordUsage(tokensUsed);

      // Verificamos que se hayan llamado las funciones de Redis
      expect(mockRedisClient.incrBy).toHaveBeenCalled();
      expect(mockRedisClient.incr).toHaveBeenCalled();
      expect(mockRedisClient.expire).toHaveBeenCalledTimes(2); // Se llama dos veces en Promise.all
    });
  });

  describe('getUsage', () => {
    it('should return current usage stats', async () => {
      const rateLimiter = new GroqRateLimiter();
      
      // Simular diferentes valores para TPM y RPM
      const mockGet = vi.fn()
        .mockResolvedValueOnce('100') // Primer llamado: tpm
        .mockResolvedValueOnce('10'); // Segundo llamado: rpm
      
      mockRedisClient.get = mockGet;

      const result = await rateLimiter.getUsage();

      expect(result).toEqual({
        tpm: 100,
        rpm: 10,
        tpmLimit: 4800,
        rpmLimit: 24
      });
    });
  });
});