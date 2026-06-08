import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mock Redis client --------------------------------------------------------

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

import { GroqRateLimiter } from '../../../infrastructure/providers/groq-rate-limiter.js';

// --- Suite --------------------------------------------------------------------

describe('GroqRateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Fix the clock so time-based Redis keys are deterministic across runs
    vi.setSystemTime(new Date(2026, 3, 16, 12, 0, 0));
    // Restore isOpen to default healthy state before each test
    mockRedisClient.isOpen = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('instantiation', () => {
    it('should create an instance successfully', () => {
      expect(new GroqRateLimiter()).toBeInstanceOf(GroqRateLimiter);
    });

    it('should expose correct default TPM and RPM limits as static properties', () => {
      expect(GroqRateLimiter.TPM_LIMIT).toBe(4800);
      expect(GroqRateLimiter.RPM_LIMIT).toBe(24);
    });
  });

  describe('canProceed', () => {
    it('should allow the request when both TPM and RPM counters are under the limit', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockRedisClient.get.mockResolvedValue('5');

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });

    it('should deny the request with reason "tpm" when the TPM counter exceeds the limit', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockRedisClient.get.mockResolvedValue(String(GroqRateLimiter.TPM_LIMIT + 200));

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('tpm');
    });

    it('should deny the request with reason "rpm" when RPM exceeds the limit but TPM is fine', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockRedisClient.get
        .mockResolvedValueOnce('5')  // TPM check — under limit
        .mockResolvedValue(String(GroqRateLimiter.RPM_LIMIT + 6)); // RPM check — over limit

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('rpm');
    });

    it('should fail open (allow the request) when Redis is not connected', async () => {
      // Arrange — simulate Redis being closed
      mockRedisClient.isOpen = false;
      const rateLimiter = new GroqRateLimiter();

      // Act
      const result = await rateLimiter.canProceed();

      // Assert — fail-open: prefer availability over strict rate limiting
      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });
  });

  describe('recordUsage', () => {
    it('should increment both TPM and RPM counters and set their TTLs', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockRedisClient.incrBy.mockResolvedValue(undefined);
      mockRedisClient.incr.mockResolvedValue(undefined);
      mockRedisClient.expire.mockResolvedValue(undefined);

      // Act
      await rateLimiter.recordUsage(100);

      // Assert — both counters must be updated atomically
      expect(mockRedisClient.incrBy).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.incr).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.expire).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUsage', () => {
    it('should return current TPM and RPM usage along with their configured limits', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockRedisClient.get = vi.fn()
        .mockResolvedValueOnce('100') // first call: tpm counter
        .mockResolvedValueOnce('10'); // second call: rpm counter

      // Act
      const result = await rateLimiter.getUsage();

      // Assert
      expect(result).toEqual({
        tpm: 100,
        rpm: 10,
        tpmLimit: GroqRateLimiter.TPM_LIMIT,
        rpmLimit: GroqRateLimiter.RPM_LIMIT,
      });
    });
  });
});
