import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

/**
 * Viewport matrix from docs/architecture.md §9.
 * Locale (ar/en) and theme variations are exercised inside the specs.
 */
const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 740 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'wide-1536', width: 1536, height: 900 },
];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: VIEWPORTS.map((vp) => ({
    name: vp.name,
    use: { ...devices['Desktop Chrome'], viewport: { width: vp.width, height: vp.height } },
  })),
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/ar`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // The design-system gallery is dev-only; enable it for the browser tests.
    env: { NEXT_PUBLIC_ENABLE_DEV_PAGES: 'true' },
  },
});
