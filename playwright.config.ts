import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ? Number(process.env.PORT) : 5173;

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
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
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
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    port,
    reuseExistingServer: true,
    timeout: 30 * 1000,
  },
});
