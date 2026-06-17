import { defineConfig } from 'vitest/config';
import path from 'path';

// Lightweight unit-test config (node env). Fixture-based contract tests for the
// new content model — no DOM/RTL needed. Reuses the app's `@/` alias.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
