import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      ENCRYPTION_KEY: '1234567890123456789012345678901234567890123456789012345678901234',
      JWT_SECRET: 'testsecret',
      JWT_EXPIRY: '15m',
      REFRESH_TOKEN_SECRET: 'refreshsecret',
      REFRESH_TOKEN_EXPIRY: '7d',
    },
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
