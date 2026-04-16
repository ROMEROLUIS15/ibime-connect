import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqRateLimiter } from '../../../infrastructure/providers/groq-rate-limiter.js';
import { redisClient } from '../../../infrastructure/cache/redis.js';

// Mock para redisClient
vi.mock('../../../infrastructure/cache/redis.js', () => ({
  redisClient: {
    isOpen: true,
    get: vi.fn(),
    incr: vi.fn(),
    incrBy: vi.fn(),
    expire: vi.fn(),
  },
}));

describe('GroqRateLimiter', () => {
  let rateLimiter: GroqRateLimiter;
  const mockRedisClient = redisClient as any;

  beforeEach(() => {
    rateLimiter = new GroqRateLimiter();
    
    // Limpiar mocks
    vi.clearAllMocks();
    
    // Mock de la fecha para controlar el tiempo
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 16, 12, 0, 0)); // Abril 16, 2026 a las 12:00:00
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('canProceed', () => {
    it('should allow request when under both TPM and RPM limits', async () => {
      // Simular que aún no se ha alcanzado ningún límite
      mockRedisClient.get.mockResolvedValueOnce('1000'); // Current TPM
      mockRedisClient.get.mockResolvedValueOnce('5');    // Current RPM
      
      const result = await rateLimiter.canProceed(500);
      
      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });

    it('should reject request when TPM limit would be exceeded', async () => {
      // Simular que casi se ha alcanzado el límite TPM
      mockRedisClient.get.mockResolvedValueOnce('4700'); // Current TPM
      mockRedisClient.get.mockResolvedValueOnce('10');   // Current RPM
      
      const result = await rateLimiter.canProceed(200); // Esto haría 4900, excediendo el límite de 4800
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('tpm');
      expect(result.waitMs).toBe(60000); // 60 segundos en ms
    });

    it('should reject request when RPM limit would be exceeded', async () => {
      // Simular que casi se ha alcanzado el límite RPM
      mockRedisClient.get.mockResolvedValueOnce('2000'); // Current TPM
      mockRedisClient.get.mockResolvedValueOnce('24');   // Current RPM (at limit)
      
      const result = await rateLimiter.canProceed(100);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('rpm');
      expect(result.waitMs).toBe(60000); // 60 segundos en ms
    });

    it('should allow request when Redis is not open (fail-open)', async () => {
      // Simular que Redis no está abierto
      mockRedisClient.isOpen = false;
      
      const result = await rateLimiter.canProceed(500);
      
      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });

    it('should allow request when Redis returns an error (fail-open)', async () => {
      // Simular error de Redis
      mockRedisClient.get.mockRejectedValueOnce(new Error('Redis connection failed'));
      
      const result = await rateLimiter.canProceed(500);
      
      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });

    it('should use default estimated tokens (450) when not provided', async () => {
      mockRedisClient.get.mockResolvedValueOnce('4000'); // Current TPM
      mockRedisClient.get.mockResolvedValueOnce('10');   // Current RPM
      
      const result = await rateLimiter.canProceed(); // No argument, should default to 450
      
      // 4000 + 450 = 4450, que es menor al límite de 4800
      expect(result.ok).toBe(true);
    });
  });

  describe('recordUsage', () => {
    it('should record token usage when Redis is open', async () => {
      const tokensUsed = 150;
      const currentMinute = Math.floor(Date.now() / 60_000).toString();
      const tpmKey = `groq:rl:tpm:${currentMinute}`;
      const rpmKey = `groq:rl:rpm:${currentMinute}`;
      
      mockRedisClient.incrBy.mockResolvedValueOnce(Promise.resolve());
      mockRedisClient.incr.mockResolvedValueOnce(Promise.resolve());
      
      await rateLimiter.recordUsage(tokensUsed);
      
      expect(mockRedisClient.incrBy).toHaveBeenCalledWith(tpmKey, tokensUsed);
      expect(mockRedisClient.incr).toHaveBeenCalledWith(rpmKey);
      expect(mockRedisClient.expire).toHaveBeenNthCalledWith(1, tpmKey, 70);
      expect(mockRedisClient.expire).toHaveBeenNthCalledWith(2, rpmKey, 70);
    });

    it('should not record usage when Redis is not open', async () => {
      mockRedisClient.isOpen = false;
      
      await rateLimiter.recordUsage(150);
      
      expect(mockRedisClient.incrBy).not.toHaveBeenCalled();
      expect(mockRedisClient.incr).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully during recording', async () => {
      const tokensUsed = 150;
      mockRedisClient.incrBy.mockRejectedValueOnce(new Error('Redis error'));
      
      // Debería completarse sin lanzar error
      await expect(rateLimiter.recordUsage(tokensUsed)).resolves.not.toThrow();
    });
  });

  describe('getUsage', () => {
    it('should return current usage when Redis is open', async () => {
      const currentMinute = Math.floor(Date.now() / 60_000).toString();
      mockRedisClient.get.mockResolvedValueOnce('2500'); // TPM
      mockRedisClient.get.mockResolvedValueOnce('15');   // RPM
      
      const result = await rateLimiter.getUsage();
      
      expect(result).toEqual({
        tpm: 2500,
        rpm: 15,
        tpmLimit: 4800,
        rpmLimit: 24,
      });
    });

    it('should return zeros when Redis is not open', async () => {
      mockRedisClient.isOpen = false;
      
      const result = await rateLimiter.getUsage();
      
      expect(result).toEqual({
        tpm: 0,
        rpm: 0,
        tpmLimit: 4800,
        rpmLimit: 24,
      });
    });

    it('should return zeros when Redis returns an error', async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error('Redis error'));
      
      const result = await rateLimiter.getUsage();
      
      expect(result).toEqual({
        tpm: 0,
        rpm: 0,
        tpmLimit: 4800,
        rpmLimit: 24,
      });
    });

    it('should handle null values from Redis', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null); // TPM
      mockRedisClient.get.mockResolvedValueOnce(null); // RPM
      
      const result = await rateLimiter.getUsage();
      
      expect(result).toEqual({
        tpm: 0,
        rpm: 0,
        tpmLimit: 4800,
        rpmLimit: 24,
      });
    });
  });
});