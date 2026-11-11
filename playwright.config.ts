import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Sonzra Tizen Smart TV Client
 * Simulates standard 1080p TV resolution (1920x1080) and remote controller events.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-tv-1080p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 15 * 1000,
  },
});
