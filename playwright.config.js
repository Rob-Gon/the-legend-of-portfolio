import { defineConfig, devices } from '@playwright/test';
import { BASE } from './vite.config.js';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    trace: 'on-first-retry',
    // Every desktop-sized test that opens the Inventory loads the 3D viewer, rendered in software
    // here. Reduced motion makes it render on demand instead of a 30 fps loop, so parallel
    // workers don't starve the CPU (it caused random timeouts). Tests needing full motion opt in.
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Smoke tests run against the production build with the real Pages base path.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
