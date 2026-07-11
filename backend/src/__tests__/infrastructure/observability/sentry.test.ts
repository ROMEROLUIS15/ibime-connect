import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * El estado `enabled` de Sentry es de módulo, así que cada caso resetea los
 * módulos y hace doMock del DSN antes del import dinámico para aislarse.
 */
describe('sentry observability', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('is a no-op when SENTRY_DSN is not configured', async () => {
    const init = vi.fn();
    const captureException = vi.fn();
    const captureMessage = vi.fn();
    vi.doMock('@sentry/node', () => ({ init, captureException, captureMessage }));
    vi.doMock('../../../config/env.config.js', () => ({ ENV: { SENTRY_DSN: undefined } }));
    vi.doMock('../../../infrastructure/logger/index.js', () => ({
      logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
    }));

    const { initSentry, isSentryEnabled, captureError, captureAlert } = await import(
      '../../../infrastructure/observability/sentry.js'
    );

    initSentry();
    expect(init).not.toHaveBeenCalled();
    expect(isSentryEnabled()).toBe(false);

    captureError(new Error('x'), { requestId: 'r1' });
    captureAlert('quota', { reason: 'tpd' });
    expect(captureException).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('initializes and captures errors/alerts when SENTRY_DSN is set', async () => {
    const init = vi.fn();
    const captureException = vi.fn();
    const captureMessage = vi.fn();
    vi.doMock('@sentry/node', () => ({ init, captureException, captureMessage }));
    vi.doMock('../../../config/env.config.js', () => ({
      ENV: { SENTRY_DSN: 'https://abc@o1.ingest.sentry.io/1' },
    }));
    vi.doMock('../../../infrastructure/logger/index.js', () => ({
      logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
    }));

    const { initSentry, isSentryEnabled, captureError, captureAlert } = await import(
      '../../../infrastructure/observability/sentry.js'
    );

    initSentry();
    expect(init).toHaveBeenCalledOnce();
    expect(isSentryEnabled()).toBe(true);

    const err = new Error('boom');
    captureError(err, { requestId: 'r1' });
    expect(captureException).toHaveBeenCalledWith(err, { extra: { requestId: 'r1' } });

    captureAlert('Groq: cuota diaria agotada (tpd)', { reason: 'tpd' });
    expect(captureMessage).toHaveBeenCalledWith('Groq: cuota diaria agotada (tpd)', {
      level: 'warning',
      extra: { reason: 'tpd' },
    });
  });
});
