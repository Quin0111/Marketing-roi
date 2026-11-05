import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 30000,
  globalSetup: './tests/support/e2e-global-setup.mjs',
  outputDir: 'tests/results/browser-artifacts',
  reporter: [['list'], ['json', { outputFile: 'tests/results/browser-results.json' }]],
  use: { channel: 'msedge', headless: true, baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 1080 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
