import { describe, it, expect } from 'vitest';
import { GroqRateLimiter } from '../../../infrastructure/providers/groq-rate-limiter.js';

describe('GroqRateLimiter', () => {
  it('should create an instance correctly', () => {
    const rateLimiter = new GroqRateLimiter();
    expect(rateLimiter).toBeInstanceOf(GroqRateLimiter);
  });

  it('should have correct default limits', () => {
    expect(GroqRateLimiter.TPM_LIMIT).toBe(4800);
    expect(GroqRateLimiter.RPM_LIMIT).toBe(24);
  });
});