import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqRateLimiter } from '../../../infrastructure/providers/groq-rate-limiter.js';

describe('GroqRateLimiter', () => {
  it('should create an instance correctly', () => {
    const rateLimiter = new GroqRateLimiter();
    expect(rateLimiter).toBeInstanceOf(GroqRateLimiter);
  });

  it('should have correct default limits', () => {
    const rateLimiter = new GroqRateLimiter();
    // Note: We can't easily test the internal logic without complex mocking
    expect(GroqRateLimiter.TPM_LIMIT).toBe(4800);
    expect(GroqRateLimiter.RPM_LIMIT).toBe(24);
  });
});

// Mock para redisClient
const mockRedisClient = {
  isOpen: true,
  get: vi.fn(),
  incr: vi.fn(),
  incrBy: vi.fn(),
  expire: vi.fn(),
};

// Importamos y reemplazamos el módulo después de haber definido el mock
vi.mock('../../../infrastructure/cache/redis.js', async () => {
  const actual = await vi.importActual('../../../infrastructure/cache/redis.js');
  return {
    ...actual,
    redisClient: mockRedisClient,
  };
});

describe('GroqRateLimiter', () => {
  let rateLimiter: GroqRateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 16, 12, 0, 0)); // Abril 16, 2026 a las 12:00:00
    
    rateLimiter = new GroqRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('canProceed', () => {
    it('should allow request when under both TPM and RPM limits', async () => {
      (mockRedisClient.get as any)
        .mockResolvedValueOnce('1000') // Current TPM
        .mockResolvedValueOnce('5');    // Current RPM
      
      const result = await rateLimiter.canProceed(500);
      
      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });

    it('should reject request when TPM limit would be exceeded', async () => {
      (mockRedisClient.get as any)
        .mockResolvedValueOnce('4700') // Current TPM
        .mockResolvedValueOnce('10');   // Current RPM
      
      const result = await rateLimiter.canProceed(200); // Esto haría 4900, excediendo el límite de 4800
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('tpm');
      expect(result.waitMs).toBe(60000); // 60 segundos en ms
    });

    it('should reject request when RPM limit would be exceeded', async () => {
      (mockRedisClient.get as any)
        .mockResolvedValueOnce('2000') // Current TPM
        .mockResolvedValueOnce('24');   // Current RPM (at limit)
      
      const result = await rateLimiter.canProceed(100);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('rpm');
      expect(result.waitMs).toBe(60000); // 60 segundos en ms
    });

    it('should allow request when Redis is not open (fail-open)', async () => {
      mockRedisClient.isOpen = false;
      
      const result = await rateLimiter.canProceed(500);
      
      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });
  });

  describe('recordUsage', () => {
    it('should record token usage when Redis is open', async () => {
      mockRedisClient.incrBy.mockResolvedValue(1);
      mockRedisClient.incr.mockResolvedValue(1);
      
      const tokensUsed = 150;
      await rateLimiter.recordUsage(tokensUsed);
      
      // Verificar que se llamaron los métodos correctos
      expect(mockRedisClient.incrBy).toHaveBeenCalled();
      expect(mockRedisClient.incr).toHaveBeenCalled();
      expect(mockRedisClient.expire).toHaveBeenCalledTimes(2);
    });

    it('should not record usage when Redis is not open', async () => {
      mockRedisClient.isOpen = false;
      
      await rateLimiter.recordUsage(150);
      
      expect(mockRedisClient.incrBy).not.toHaveBeenCalled();
      expect(mockRedisClient.incr).not.toHaveBeenCalled();
    });
  });

  describe('getUsage', () => {
    it('should return current usage when Redis is open', async () => {
      (mockRedisClient.get as any)
        .mockResolvedValueOnce('2500') // TPM
        .mockResolvedValueOnce('15');   // RPM
      
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
  });
});