import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BACKEND_PORT = Number(process.env.HAVIT_E2E_BACKEND_PORT ?? 3300);
const FRONTEND_PORT = Number(process.env.HAVIT_E2E_FRONTEND_PORT ?? 5174);
const E2E_RUN_ID = process.env.HAVIT_E2E_RUN_ID ?? String(Date.now());
const E2E_DATA_DIR = process.env.HAVIT_E2E_DATA_DIR ?? path.join(projectRoot, 'tmp', 'e2e-data', E2E_RUN_ID);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Shanghai',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: `cmd /c "cd /d ${projectRoot} && go run ./cmd/havit"`,
      port: BACKEND_PORT,
      reuseExistingServer: false,
      env: {
        HAVIT_MODE: 'demo',
        HAVIT_SERVER_PORT: String(BACKEND_PORT),
        HAVIT_DATA_DIR: E2E_DATA_DIR,
        GOSUMDB: 'sum.golang.org',
      },
      timeout: 120_000,
    },
    {
      command: 'pnpm dev',
      port: FRONTEND_PORT,
      reuseExistingServer: false,
      env: {
        HAVIT_E2E_BACKEND_PORT: String(BACKEND_PORT),
        HAVIT_E2E_FRONTEND_PORT: String(FRONTEND_PORT),
      },
      timeout: 30_000,
    },
  ],
});
