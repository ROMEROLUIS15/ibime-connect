/**
 * GroqRateLimiter — Sliding window rate limiter for Groq free-tier API.
 *
 * Protects against saturating the Groq free-tier limits:
 *   - 6,000 Tokens Per Minute (TPM)
 *   - 30 Requests Per Minute (RPM)
 *
 * Strategy: operate at 80% of the real limits to maintain a safety buffer.
 * Uses Redis INCR + EXPIRE for atomic per-minute counters.
 *
 * Fail-open: if Redis is unavailable, all requests proceed normally
 * (consistent with the project's graceful degradation pattern).
 */

import { redisClient } from '../cache/redis.js';
import { logger } from '../logger/index.js';

export interface RateLimitCheck {
  ok: boolean;
  /** Milliseconds to wait before retrying (only set when ok=false) */
  waitMs: number;
  reason?: 'tpm' | 'rpm';
}

export class GroqRateLimiter {
  // 80% of Groq free-tier limits — conservative buffer
  static readonly TPM_LIMIT = 4_800;  // real: 6,000 TPM
  static readonly RPM_LIMIT = 24;     // real: 30 RPM

  // Redis key prefix for isolation
  private static readonly NS = 'groq:rl';

  /**
   * Returns the current UNIX minute as a string (used as Redis key suffix).
   * Changes every 60 seconds, naturally expiring old keys.
   */
  private static currentMinute(): string {
    return String(Math.floor(Date.now() / 60_000));
  }

  /**
   * Check whether a new LLM request can proceed.
   * Reads current RPM and TPM counters without incrementing them.
   *
   * @param estimatedTokens - Pessimistic estimate of tokens the call will use.
   *   Default: 450 (conservative average across all flows after budget reduction).
   */
  async canProceed(estimatedTokens = 450): Promise<RateLimitCheck> {
    if (!redisClient.isOpen) {
      // Fail-open: Redis unavailable → allow request (graceful degradation)
      return { ok: true, waitMs: 0 };
    }

    try {
      const minute = GroqRateLimiter.currentMinute();
      const tpmKey = `${GroqRateLimiter.NS}:tpm:${minute}`;
      const rpmKey = `${GroqRateLimiter.NS}:rpm:${minute}`;

      const [tpmRaw, rpmRaw] = await Promise.all([
        redisClient.get(tpmKey),
        redisClient.get(rpmKey),
      ]);

      const currentTpm = parseInt(tpmRaw ?? '0', 10);
      const currentRpm = parseInt(rpmRaw ?? '0', 10);

      // Seconds remaining in the current minute window
      const secondsIntoMinute = Math.floor((Date.now() % 60_000) / 1_000);
      const secondsUntilReset = 60 - secondsIntoMinute;
      const waitMs = secondsUntilReset * 1_000;

      if (currentTpm + estimatedTokens > GroqRateLimiter.TPM_LIMIT) {
        logger.warn(
          { currentTpm, estimatedTokens, limit: GroqRateLimiter.TPM_LIMIT, waitMs },
          'GroqRateLimiter: TPM limit reached — request deferred'
        );
        return { ok: false, waitMs, reason: 'tpm' };
      }

      if (currentRpm + 1 > GroqRateLimiter.RPM_LIMIT) {
        logger.warn(
          { currentRpm, limit: GroqRateLimiter.RPM_LIMIT, waitMs },
          'GroqRateLimiter: RPM limit reached — request deferred'
        );
        return { ok: false, waitMs, reason: 'rpm' };
      }

      return { ok: true, waitMs: 0 };
    } catch (err) {
      // Redis error → fail-open (don't break the chat flow)
      logger.error({ error: (err as Error).message }, 'GroqRateLimiter: Redis error, failing open');
      return { ok: true, waitMs: 0 };
    }
  }

  /**
   * Record actual token usage after a successful LLM call.
   * Uses INCR + EXPIRE (TTL: 70s) so keys auto-expire just after the minute window.
   *
   * Call this AFTER a successful generateAnswer() — not before.
   */
  async recordUsage(tokensUsed: number): Promise<void> {
    if (!redisClient.isOpen) return;

    try {
      const minute = GroqRateLimiter.currentMinute();
      const tpmKey = `${GroqRateLimiter.NS}:tpm:${minute}`;
      const rpmKey = `${GroqRateLimiter.NS}:rpm:${minute}`;

      // INCR is atomic — safe for concurrent requests
      await Promise.all([
        redisClient.incrBy(tpmKey, tokensUsed).then(() =>
          redisClient.expire(tpmKey, 70)  // expire 10s after the minute ends
        ),
        redisClient.incr(rpmKey).then(() =>
          redisClient.expire(rpmKey, 70)
        ),
      ]);

      logger.debug({ tokensUsed, tpmKey, rpmKey }, 'GroqRateLimiter: usage recorded');
    } catch (err) {
      // Non-fatal: just log and continue
      logger.error({ error: (err as Error).message }, 'GroqRateLimiter: failed to record usage');
    }
  }

  /**
   * Returns current TPM/RPM usage for observability (e.g., health endpoint).
   */
  async getUsage(): Promise<{ tpm: number; rpm: number; tpmLimit: number; rpmLimit: number }> {
    if (!redisClient.isOpen) {
      return { tpm: 0, rpm: 0, tpmLimit: GroqRateLimiter.TPM_LIMIT, rpmLimit: GroqRateLimiter.RPM_LIMIT };
    }

    try {
      const minute = GroqRateLimiter.currentMinute();
      const [tpmRaw, rpmRaw] = await Promise.all([
        redisClient.get(`${GroqRateLimiter.NS}:tpm:${minute}`),
        redisClient.get(`${GroqRateLimiter.NS}:rpm:${minute}`),
      ]);
      return {
        tpm: parseInt(tpmRaw ?? '0', 10),
        rpm: parseInt(rpmRaw ?? '0', 10),
        tpmLimit: GroqRateLimiter.TPM_LIMIT,
        rpmLimit: GroqRateLimiter.RPM_LIMIT,
      };
    } catch {
      return { tpm: 0, rpm: 0, tpmLimit: GroqRateLimiter.TPM_LIMIT, rpmLimit: GroqRateLimiter.RPM_LIMIT };
    }
  }
}

/** Singleton instance — shared across the application */
export const groqRateLimiter = new GroqRateLimiter();
