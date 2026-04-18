import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['e2e/**/*.spec.ts'],
    globalSetup: './e2e/global-setup.ts',
    testTimeout: 600_000,
    hookTimeout: 600_000,
    reporters: 'default',
    fileParallelism: false,
  },
});
