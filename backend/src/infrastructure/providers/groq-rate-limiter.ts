/**
 * GroqRateLimiter — Sliding window rate limiter for the Groq API.
 *
 * Enforces the four limits Groq applies to the configured model (GROQ_MODEL):
 *   - Tokens Per Minute (TPM)   — GROQ_TPM_LIMIT
 *   - Requests Per Minute (RPM) — GROQ_RPM_LIMIT
 *   - Requests Per Day (RPD)    — GROQ_RPD_LIMIT
 *   - Tokens Per Day (TPD)      — GROQ_TPD_LIMIT
 *
 * Strategy: the per-minute windows operate at GROQ_SAFETY_MARGIN (80% by default)
 * of the real limits, keeping a buffer for traffic spikes. The per-day windows use
 * the full quota — a 24h window has no burst to absorb, so backing off there would
 * only forfeit requests. Uses Redis INCR + EXPIRE for atomic counters.
 *
 * The per-day windows matter: on the free tier the daily request cap (1,000) is
 * far tighter than the per-minute one, so a steady trickle of traffic exhausts
 * the day long before it ever trips TPM/RPM.
 *
 * Fail-open: if Redis is unavailable, all requests proceed normally
 * (consistent with the project's graceful degradation pattern).
 */

import { redisClient } from '../cache/redis.js';
import { logger } from '../logger/index.js';
import { ENV } from '../../config/env.config.js';

/** Which window rejected the request. Per-day reasons need a different UX message. */
export type RateLimitReason = 'tpm' | 'rpm' | 'rpd' | 'tpd';

export interface RateLimitCheck {
  ok: boolean;
  /** Milliseconds to wait before retrying (only set when ok=false) */
  waitMs: number;
  reason?: RateLimitReason;
}

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/** Applies the safety margin and floors — never yields 0 for a positive limit. */
function withSafetyMargin(realLimit: number): number {
  return Math.max(1, Math.floor(realLimit * ENV.GROQ_SAFETY_MARGIN));
}

export class GroqRateLimiter {
  // Per-minute: back off to GROQ_SAFETY_MARGIN of the real limit. The buffer
  // absorbs bursts that would otherwise land inside the same 60s window.
  static readonly TPM_LIMIT = withSafetyMargin(ENV.GROQ_TPM_LIMIT);
  static readonly RPM_LIMIT = withSafetyMargin(ENV.GROQ_RPM_LIMIT);

  // Per-day: use the full quota. Over 24h there is no burst to absorb, so a
  // margin here would just forfeit requests we are entitled to.
  static readonly RPD_LIMIT = ENV.GROQ_RPD_LIMIT;
  static readonly TPD_LIMIT = ENV.GROQ_TPD_LIMIT;

  // Redis key prefix for isolation
  private static readonly NS = 'groq:rl';

  /** TTLs sized slightly past each window so keys expire on their own. */
  private static readonly MINUTE_TTL_SEC = 70;
  private static readonly DAY_TTL_SEC = 90_000; // 25h

  /**
   * Returns the current UNIX minute as a string (used as Redis key suffix).
   * Changes every 60 seconds, naturally expiring old keys.
   */
  private static currentMinute(): string {
    return String(Math.floor(Date.now() / MS_PER_MINUTE));
  }

  /**
   * Returns the current UTC day as a string (used as Redis key suffix).
   * Groq resets daily quotas on UTC midnight, which is what this bucket tracks.
   */
  private static currentDay(): string {
    return String(Math.floor(Date.now() / MS_PER_DAY));
  }

  private static keys() {
    const minute = GroqRateLimiter.currentMinute();
    const day = GroqRateLimiter.currentDay();
    return {
      tpmKey: `${GroqRateLimiter.NS}:tpm:${minute}`,
      rpmKey: `${GroqRateLimiter.NS}:rpm:${minute}`,
      rpdKey: `${GroqRateLimiter.NS}:rpd:${day}`,
      tpdKey: `${GroqRateLimiter.NS}:tpd:${day}`,
    };
  }

  /** Milliseconds left in the current minute window. */
  private static msUntilNextMinute(): number {
    return MS_PER_MINUTE - (Date.now() % MS_PER_MINUTE);
  }

  /** Milliseconds left until the next UTC midnight (daily quota reset). */
  private static msUntilNextDay(): number {
    return MS_PER_DAY - (Date.now() % MS_PER_DAY);
  }

  /**
   * Check whether a new LLM request can proceed.
   * Reads the current counters without incrementing them.
   *
   * Daily windows are checked first: when the day is exhausted there is no point
   * telling the caller to retry in 40 seconds.
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
      const { tpmKey, rpmKey, rpdKey, tpdKey } = GroqRateLimiter.keys();

      const [tpmRaw, rpmRaw, rpdRaw, tpdRaw] = await Promise.all([
        redisClient.get(tpmKey),
        redisClient.get(rpmKey),
        redisClient.get(rpdKey),
        redisClient.get(tpdKey),
      ]);

      const currentTpm = parseInt(tpmRaw ?? '0', 10);
      const currentRpm = parseInt(rpmRaw ?? '0', 10);
      const currentRpd = parseInt(rpdRaw ?? '0', 10);
      const currentTpd = parseInt(tpdRaw ?? '0', 10);

      const dayWaitMs = GroqRateLimiter.msUntilNextDay();
      const minuteWaitMs = GroqRateLimiter.msUntilNextMinute();

      // ── Daily windows ──────────────────────────────────────────────────────
      if (currentTpd + estimatedTokens > GroqRateLimiter.TPD_LIMIT) {
        logger.warn(
          { currentTpd, estimatedTokens, limit: GroqRateLimiter.TPD_LIMIT, waitMs: dayWaitMs },
          'GroqRateLimiter: daily token quota exhausted — request rejected'
        );
        return { ok: false, waitMs: dayWaitMs, reason: 'tpd' };
      }

      if (currentRpd + 1 > GroqRateLimiter.RPD_LIMIT) {
        logger.warn(
          { currentRpd, limit: GroqRateLimiter.RPD_LIMIT, waitMs: dayWaitMs },
          'GroqRateLimiter: daily request quota exhausted — request rejected'
        );
        return { ok: false, waitMs: dayWaitMs, reason: 'rpd' };
      }

      // ── Per-minute windows ─────────────────────────────────────────────────
      if (currentTpm + estimatedTokens > GroqRateLimiter.TPM_LIMIT) {
        logger.warn(
          { currentTpm, estimatedTokens, limit: GroqRateLimiter.TPM_LIMIT, waitMs: minuteWaitMs },
          'GroqRateLimiter: TPM limit reached — request deferred'
        );
        return { ok: false, waitMs: minuteWaitMs, reason: 'tpm' };
      }

      if (currentRpm + 1 > GroqRateLimiter.RPM_LIMIT) {
        logger.warn(
          { currentRpm, limit: GroqRateLimiter.RPM_LIMIT, waitMs: minuteWaitMs },
          'GroqRateLimiter: RPM limit reached — request deferred'
        );
        return { ok: false, waitMs: minuteWaitMs, reason: 'rpm' };
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
   * Increments both the per-minute and the per-day counters.
   *
   * Call this AFTER a successful generateAnswer() — not before.
   */
  async recordUsage(tokensUsed: number): Promise<void> {
    if (!redisClient.isOpen) return;

    try {
      const { tpmKey, rpmKey, rpdKey, tpdKey } = GroqRateLimiter.keys();

      // INCR is atomic — safe for concurrent requests
      await Promise.all([
        redisClient.incrBy(tpmKey, tokensUsed).then(() =>
          redisClient.expire(tpmKey, GroqRateLimiter.MINUTE_TTL_SEC)
        ),
        redisClient.incr(rpmKey).then(() =>
          redisClient.expire(rpmKey, GroqRateLimiter.MINUTE_TTL_SEC)
        ),
        redisClient.incrBy(tpdKey, tokensUsed).then(() =>
          redisClient.expire(tpdKey, GroqRateLimiter.DAY_TTL_SEC)
        ),
        redisClient.incr(rpdKey).then(() =>
          redisClient.expire(rpdKey, GroqRateLimiter.DAY_TTL_SEC)
        ),
      ]);

      logger.debug({ tokensUsed, tpmKey, rpmKey, rpdKey, tpdKey }, 'GroqRateLimiter: usage recorded');
    } catch (err) {
      // Non-fatal: just log and continue
      logger.error({ error: (err as Error).message }, 'GroqRateLimiter: failed to record usage');
    }
  }

  /**
   * Returns current usage for observability (e.g., health endpoint).
   */
  async getUsage(): Promise<{
    tpm: number; rpm: number; rpd: number; tpd: number;
    tpmLimit: number; rpmLimit: number; rpdLimit: number; tpdLimit: number;
  }> {
    const limits = {
      tpmLimit: GroqRateLimiter.TPM_LIMIT,
      rpmLimit: GroqRateLimiter.RPM_LIMIT,
      rpdLimit: GroqRateLimiter.RPD_LIMIT,
      tpdLimit: GroqRateLimiter.TPD_LIMIT,
    };

    if (!redisClient.isOpen) {
      return { tpm: 0, rpm: 0, rpd: 0, tpd: 0, ...limits };
    }

    try {
      const { tpmKey, rpmKey, rpdKey, tpdKey } = GroqRateLimiter.keys();
      const [tpmRaw, rpmRaw, rpdRaw, tpdRaw] = await Promise.all([
        redisClient.get(tpmKey),
        redisClient.get(rpmKey),
        redisClient.get(rpdKey),
        redisClient.get(tpdKey),
      ]);
      return {
        tpm: parseInt(tpmRaw ?? '0', 10),
        rpm: parseInt(rpmRaw ?? '0', 10),
        rpd: parseInt(rpdRaw ?? '0', 10),
        tpd: parseInt(tpdRaw ?? '0', 10),
        ...limits,
      };
    } catch {
      return { tpm: 0, rpm: 0, rpd: 0, tpd: 0, ...limits };
    }
  }
}

/** Singleton instance — shared across the application */
export const groqRateLimiter = new GroqRateLimiter();
