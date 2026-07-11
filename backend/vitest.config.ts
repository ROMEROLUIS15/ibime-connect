import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    setupFiles: ['src/__tests__/setup.ts'],
    // Clave admin determinista para los tests de endpoints protegidos (auth guard).
    env: {
      ADMIN_SECRET: 'test-admin-secret',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/__tests__/**'],
      // Umbrales fijados unos puntos por debajo de la cobertura actual
      // (Stmts ~85 / Branch ~79 / Funcs ~83 / Lines ~87) para gatear regresiones
      // sin ser frágiles ante el flake ocasional del worker. Súbelos al mejorar.
      thresholds: {
        statements: 82,
        branches: 74,
        functions: 78,
        lines: 82,
      },
    },
    include: ['src/__tests__/**/*.test.ts'],
  },
});
