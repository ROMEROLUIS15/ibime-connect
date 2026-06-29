import { describe, it, expect, vi, afterEach } from 'vitest';
import { createSessionId } from '../../lib/session-id';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('createSessionId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a valid RFC 4122 v4 UUID using crypto.randomUUID when available', () => {
    const id = createSessionId();
    expect(id).toMatch(UUID_V4);
  });

  it('should produce a distinct id on each call', () => {
    const a = createSessionId();
    const b = createSessionId();
    expect(a).not.toBe(b);
  });

  it('should fall back to a valid v4 UUID when crypto.randomUUID is unavailable', () => {
    vi.spyOn(globalThis, 'crypto', 'get').mockReturnValue({
      // randomUUID omitted on purpose to exercise the fallback path
      getRandomValues: globalThis.crypto?.getRandomValues?.bind(globalThis.crypto),
    } as unknown as Crypto);

    const id = createSessionId();
    expect(id).toMatch(UUID_V4);
  });
});
