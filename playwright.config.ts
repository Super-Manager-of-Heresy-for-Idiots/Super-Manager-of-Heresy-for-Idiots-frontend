import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the tactical-battle E2E skeleton (MAP_PLAN §1.10).
 *
 * This is a SCAFFOLD, not a wired-up suite: it needs the full local dev stack running
 * (core backend + map-service + frontend) and a seeded GM account. It is intentionally
 * kept out of the app's `tsc -b` build and the vitest run.
 *
 * Setup (run once, on a machine with the stack available):
 *   npm i -D @playwright/test && npx playwright install
 *   E2E_BASE_URL=http://localhost:5173 npm run test:e2e
 *
 * See e2e/README.md for what still needs filling in (auth storage state, data seeding,
 * and the stable selectors marked with TODO in the spec).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
