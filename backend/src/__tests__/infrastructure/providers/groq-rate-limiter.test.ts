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

// Límites fijos del free tier de openai/gpt-oss-20b, para que las aserciones no
// dependan del .env de quien corra los tests.
vi.mock('../../../config/env.config.js', () => ({
  ENV: {
    GROQ_TPM_LIMIT: 8_000,
    GROQ_RPM_LIMIT: 30,
    GROQ_RPD_LIMIT: 1_000,
    GROQ_TPD_LIMIT: 200_000,
    GROQ_SAFETY_MARGIN: 0.8,
  },
}));

import { GroqRateLimiter } from '../../../infrastructure/providers/groq-rate-limiter.js';

// --- Helpers ------------------------------------------------------------------

/**
 * Hace que redisClient.get() responda según la clave pedida. Necesario porque
 * canProceed() lee los cuatro contadores en un Promise.all: encadenar
 * mockResolvedValueOnce ata el test al orden de las lecturas.
 */
function mockCounters({ tpm = 0, rpm = 0, rpd = 0, tpd = 0 } = {}) {
  mockRedisClient.get.mockImplementation(async (key: string) => {
    if (key.includes(':tpm:')) return String(tpm);
    if (key.includes(':rpm:')) return String(rpm);
    if (key.includes(':rpd:')) return String(rpd);
    if (key.includes(':tpd:')) return String(tpd);
    return null;
  });
}

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

    it('should apply the safety margin to the per-minute limits only', () => {
      // Free tier de openai/gpt-oss-20b: 8,000 TPM / 30 RPM / 1,000 RPD / 200,000 TPD
      expect(GroqRateLimiter.TPM_LIMIT).toBe(6_400); // 80% de 8,000
      expect(GroqRateLimiter.RPM_LIMIT).toBe(24);    // 80% de 30
    });

    it('should expose the per-day limits at their full quota, with no margin applied', () => {
      // En 24h no hay ráfaga que absorber: recortar aquí sería regalar peticiones.
      expect(GroqRateLimiter.RPD_LIMIT).toBe(1_000);
      expect(GroqRateLimiter.TPD_LIMIT).toBe(200_000);
    });
  });

  describe('canProceed', () => {
    it('should allow the request when every counter is under its limit', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockCounters({ tpm: 5, rpm: 1, rpd: 10, tpd: 500 });

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.waitMs).toBe(0);
    });

    it('should deny the request with reason "tpm" when the TPM counter exceeds the limit', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockCounters({ tpm: GroqRateLimiter.TPM_LIMIT + 200 });

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('tpm');
    });

    it('should deny the request with reason "rpm" when RPM exceeds the limit but TPM is fine', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockCounters({ tpm: 5, rpm: GroqRateLimiter.RPM_LIMIT + 6 });

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('rpm');
    });

    it('should deny the request with reason "rpd" when the daily request quota is exhausted', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockCounters({ rpd: GroqRateLimiter.RPD_LIMIT });

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('rpd');
    });

    it('should deny the request with reason "tpd" when the daily token quota is exhausted', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockCounters({ tpd: GroqRateLimiter.TPD_LIMIT });

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('tpd');
    });

    it('should report the daily reason (not the per-minute one) when both windows are saturated', async () => {
      // Arrange — un minuto saturado Y el día agotado: el día manda, porque
      // reintentar en 40s no serviría de nada.
      const rateLimiter = new GroqRateLimiter();
      mockCounters({
        tpm: GroqRateLimiter.TPM_LIMIT + 1,
        rpm: GroqRateLimiter.RPM_LIMIT + 1,
        rpd: GroqRateLimiter.RPD_LIMIT,
      });

      // Act
      const result = await rateLimiter.canProceed();

      // Assert
      expect(result.reason).toBe('rpd');
    });

    it('should return a waitMs lasting until UTC midnight when a daily quota is exhausted', async () => {
      // Arrange — el reloj está fijado a las 12:00 hora local en beforeEach
      const rateLimiter = new GroqRateLimiter();
      mockCounters({ rpd: GroqRateLimiter.RPD_LIMIT });
      const expectedWaitMs = 86_400_000 - (Date.now() % 86_400_000);

      // Act
      const result = await rateLimiter.canProceed();

      // Assert — horas, no segundos: debe superar con creces la ventana del minuto
      expect(result.waitMs).toBe(expectedWaitMs);
      expect(result.waitMs).toBeGreaterThan(60_000);
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
    it('should increment the per-minute and per-day counters and set their TTLs', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockRedisClient.incrBy.mockResolvedValue(undefined);
      mockRedisClient.incr.mockResolvedValue(undefined);
      mockRedisClient.expire.mockResolvedValue(undefined);

      // Act
      await rateLimiter.recordUsage(100);

      // Assert — tokens (incrBy) para TPM+TPD, requests (incr) para RPM+RPD
      expect(mockRedisClient.incrBy).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.incr).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.expire).toHaveBeenCalledTimes(4);
    });

    it('should give the daily keys a TTL that outlives the per-minute ones', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockRedisClient.incrBy.mockResolvedValue(undefined);
      mockRedisClient.incr.mockResolvedValue(undefined);
      mockRedisClient.expire.mockResolvedValue(undefined);

      // Act
      await rateLimiter.recordUsage(100);

      // Assert — una clave diaria que expire en 70s reabriría la cuota cada minuto
      const ttlByKey = new Map<string, number>(
        mockRedisClient.expire.mock.calls.map(([key, ttl]) => [key as string, ttl as number])
      );
      for (const [key, ttl] of ttlByKey) {
        const isDaily = key.includes(':rpd:') || key.includes(':tpd:');
        expect(ttl).toBe(isDaily ? 90_000 : 70);
      }
    });
  });

  describe('getUsage', () => {
    it('should return all four counters along with their configured limits', async () => {
      // Arrange
      const rateLimiter = new GroqRateLimiter();
      mockCounters({ tpm: 100, rpm: 10, rpd: 300, tpd: 50_000 });

      // Act
      const result = await rateLimiter.getUsage();

      // Assert
      expect(result).toEqual({
        tpm: 100,
        rpm: 10,
        rpd: 300,
        tpd: 50_000,
        tpmLimit: GroqRateLimiter.TPM_LIMIT,
        rpmLimit: GroqRateLimiter.RPM_LIMIT,
        rpdLimit: GroqRateLimiter.RPD_LIMIT,
        tpdLimit: GroqRateLimiter.TPD_LIMIT,
      });
    });
  });
});
