import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificationThrottleService } from '../../services/verification-throttle.service.js';
import { redisClient } from '../../infrastructure/cache/redis.js';

vi.mock('../../infrastructure/cache/redis.js', () => ({
  redisClient: {
    get: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
    ttl: vi.fn(),
  },
}));

const redis = redisClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  incr: ReturnType<typeof vi.fn>;
  expire: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  ttl: ReturnType<typeof vi.fn>;
};

describe('VerificationThrottleService', () => {
  const service = new VerificationThrottleService();
  const email = 'ana@mail.com';

  beforeEach(() => {
    Object.values(redis).forEach((fn) => fn.mockReset());
  });

  it('should allow when there are no prior failures', async () => {
    redis.get.mockResolvedValue(null);
    const result = await service.check(email);
    expect(result.allowed).toBe(true);
  });

  it('should allow while under the failure threshold', async () => {
    redis.get.mockResolvedValue('4');
    const result = await service.check(email);
    expect(result.allowed).toBe(true);
  });

  it('should block once the threshold is reached and report retryAfter', async () => {
    redis.get.mockResolvedValue('5');
    redis.ttl.mockResolvedValue(600);

    const result = await service.check(email);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(600);
  });

  it('should set the TTL only on the first failure', async () => {
    redis.incr.mockResolvedValueOnce(1);
    await service.recordFailure(email);
    expect(redis.expire).toHaveBeenCalledTimes(1);

    redis.incr.mockResolvedValueOnce(2);
    await service.recordFailure(email);
    expect(redis.expire).toHaveBeenCalledTimes(1); // still once
  });

  it('should fail-open (allow) when Redis throws', async () => {
    redis.get.mockRejectedValue(new Error('Redis down'));
    const result = await service.check(email);
    expect(result.allowed).toBe(true);
  });

  it('should clear the counter on reset', async () => {
    await service.reset(email);
    expect(redis.del).toHaveBeenCalledOnce();
  });
});
