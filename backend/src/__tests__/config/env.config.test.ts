import { describe, it, expect } from 'vitest';
import { envSchema } from '../../config/env.config.js';

/**
 * Probamos el SCHEMA directamente (no el arranque), de modo que no se dispara el
 * process.exit. Esto es posible porque validación y tipos comparten una sola
 * fuente de verdad exportada.
 */

const validEnv = {
  SUPABASE_URL: 'https://proj.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  GEMINI_API_KEY: 'gemini-key',
  GROQ_API_KEY: 'groq-key',
};

describe('envSchema', () => {
  it('should accept a minimal valid environment and apply defaults', () => {
    const parsed = envSchema.safeParse(validEnv);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.PORT).toBe(3000);
      expect(parsed.data.FRONTEND_URL).toBe('http://localhost:5173');
      expect(parsed.data.REDIS_URL).toBe('redis://localhost:6379');
      expect(parsed.data.ADMIN_SECRET).toBeUndefined();
    }
  });

  it('should coerce PORT from a string to a number', () => {
    const parsed = envSchema.safeParse({ ...validEnv, PORT: '8080' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.PORT).toBe(8080);
      expect(typeof parsed.data.PORT).toBe('number');
    }
  });

  it('should reject when a required variable is missing', () => {
    const { SUPABASE_URL: _omitted, ...withoutUrl } = validEnv;
    const parsed = envSchema.safeParse(withoutUrl);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.includes('SUPABASE_URL'))).toBe(true);
    }
  });

  it('should reject a malformed SUPABASE_URL (format validation, not just presence)', () => {
    const parsed = envSchema.safeParse({ ...validEnv, SUPABASE_URL: 'not-a-url' });
    expect(parsed.success).toBe(false);
  });

  it('should aggregate ALL problems at once', () => {
    const parsed = envSchema.safeParse({ SUPABASE_URL: 'bad' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      // SUPABASE_URL (formato) + 3 claves requeridas ausentes
      expect(parsed.error.issues.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('should keep ADMIN_SECRET optional', () => {
    const parsed = envSchema.safeParse({ ...validEnv, ADMIN_SECRET: 'secret' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ADMIN_SECRET).toBe('secret');
    }
  });
});
