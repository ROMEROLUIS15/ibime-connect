import { describe, it, expect } from 'vitest';
import { buildRedisTlsOptions } from '../../../infrastructure/cache/redis.js';

describe('buildRedisTlsOptions', () => {
  it('sin rediss:// → sin TLS (objeto vacío)', () => {
    expect(buildRedisTlsOptions({ url: 'redis://localhost:6379' })).toEqual({});
  });

  it('rediss:// localhost en desarrollo → TLS sin validar certificado', () => {
    const o = buildRedisTlsOptions({ url: 'rediss://localhost:6379', nodeEnv: 'development' });
    expect(o).toMatchObject({ tls: true, rejectUnauthorized: false });
    expect('ca' in o).toBe(false);
  });

  it('rediss:// en producción sin CA → valida contra el bundle del SO', () => {
    const o = buildRedisTlsOptions({ url: 'rediss://host.redis-cloud.com:6379', nodeEnv: 'production' });
    expect(o).toMatchObject({ tls: true, rejectUnauthorized: true });
    expect('ca' in o).toBe(false);
  });

  it('rediss:// con CA → pasa el certificado como `ca` y mantiene rejectUnauthorized', () => {
    const ca = '-----BEGIN CERTIFICATE-----\nMIIBfake\n-----END CERTIFICATE-----';
    const o = buildRedisTlsOptions({ url: 'rediss://host:6379', nodeEnv: 'production', caCert: ca });
    expect(o).toMatchObject({ tls: true, rejectUnauthorized: true, ca });
  });

  it('normaliza saltos de línea escapados (\\n) del CA a saltos reales', () => {
    const escaped = '-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----';
    const o = buildRedisTlsOptions({ url: 'rediss://host:6379', nodeEnv: 'production', caCert: escaped }) as { ca: string };
    expect(o.ca).toBe('-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----');
    expect(o.ca).not.toContain('\\n');
  });

  it('CA vacío o en blanco → no añade `ca`', () => {
    const o = buildRedisTlsOptions({ url: 'rediss://host:6379', nodeEnv: 'production', caCert: '   ' });
    expect('ca' in o).toBe(false);
  });
});
