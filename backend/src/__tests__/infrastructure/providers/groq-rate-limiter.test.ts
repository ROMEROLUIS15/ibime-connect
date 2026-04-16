import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqRateLimiter } from '../../../infrastructure/providers/groq-rate-limiter.js';

// Creamos un mock directamente en el archivo de test
const mockRedisClient = {
  isOpen: true,
  get: vi.fn(),
  incr: vi.fn(),
  incrBy: vi.fn(),
  expire: vi.fn(),
};

// Creamos un módulo temporal para usar en lugar del real
const createTestModule = async () => {
  // Simulamos el provider con nuestro mock
  vi.doMock('../../../infrastructure/cache/redis.js', () => ({
    redisClient: mockRedisClient,
  }));

  // Importamos dinámicamente el módulo después de hacer el mock
  const { GroqRateLimiter } = await import('../../../infrastructure/providers/groq-rate-limiter.js');
  
  return { GroqRateLimiter };
};

describe('GroqRateLimiter', () => {
  it('should create an instance correctly', async () => {
    const { GroqRateLimiter } = await createTestModule();
    const rateLimiter = new GroqRateLimiter();
    expect(rateLimiter).toBeInstanceOf(GroqRateLimiter);
  });

  it('should have correct default limits', async () => {
    const { GroqRateLimiter } = await createTestModule();
    const rateLimiter = new GroqRateLimiter();
    // Note: We can't easily test the internal logic without complex mocking
    expect(GroqRateLimiter.TPM_LIMIT).toBe(4800);
    expect(GroqRateLimiter.RPM_LIMIT).toBe(24);
  });
});

describe('GroqRateLimiter - with mocked redis', () => {
  let rateLimiter: GroqRateLimiter;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 16, 12, 0, 0)); // Abril 16, 2026 a las 12:00:00
    
    const { GroqRateLimiter } = await createTestModule();
    rateLimiter = new GroqRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('canProceed', () => {
    it('should allow request when under limit', async () => {
      // Mock para simular que el contador actual es menor que el límite
      mockRedisClient.get.mockResolvedValue('5');

      const result = await rateLimiter.canProceed('test-api-key');

      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });

    it('should deny request when over TPM limit', async () => {
      // Mock para simular que el contador actual supera el límite
      mockRedisClient.get.mockResolvedValue('5000');

      const result = await rateLimiter.canProceed();

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('tpm');
    });

    it('should deny request when over RPM limit', async () => {
      // Mock para simular que el contador actual supera el límite
      mockRedisClient.get.mockResolvedValueOnce('5') // TPM check
                           .mockResolvedValue('30'); // RPM check

      const result = await rateLimiter.canProceed();

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('rpm');
    });
  });

  describe('recordUsage', () => {
    it('should record token usage correctly', async () => {
      const tokensUsed = 100;
      mockRedisClient.incrBy.mockResolvedValue(Promise.resolve());
      mockRedisClient.incr.mockResolvedValue(Promise.resolve());

      await rateLimiter.recordUsage(tokensUsed);

      // Verificamos que se hayan llamado las funciones de Redis
      expect(mockRedisClient.incrBy).toHaveBeenCalled();
      expect(mockRedisClient.incr).toHaveBeenCalled();
    });
  });

  describe('getUsage', () => {
    it('should return current usage stats', async () => {
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