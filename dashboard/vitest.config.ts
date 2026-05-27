import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    env: {
      RUN_MODE: 'dry_run',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@system': path.resolve(__dirname, '../system'),
    },
  },
});