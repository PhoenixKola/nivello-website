import { defineConfig, devices } from '@playwright/test'

const publicPort = 4173
const adminPort = 4174

// Both suites run against the static export, so `npm run build` must have produced ./out first.
// The admin suites also need the PHP CLI (the harness runs `php -S`); nothing touches real GitHub.
export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    reducedMotion: 'reduce',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'public',
      testIgnore: ['admin/**'],
      fullyParallel: true,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${publicPort}` }
    },
    {
      // Shares one data store: runs serially.
      name: 'admin-api',
      testMatch: ['admin/api.spec.ts', 'admin/ops.spec.ts', 'admin/php-unit.spec.ts'],
      fullyParallel: false,
      use: { baseURL: `http://127.0.0.1:${adminPort}` }
    },
    {
      name: 'admin-ui',
      testMatch: ['admin/ui.spec.ts', 'admin/ops-ui.spec.ts'],
      fullyParallel: false,
      dependencies: ['admin-api'],
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${adminPort}` }
    }
  ],
  workers: 1,
  webServer: [
    {
      command: 'node scripts/serve-out.mjs',
      url: `http://localhost:${publicPort}/`,
      reuseExistingServer: !process.env.CI,
      env: { PORT: String(publicPort) }
    },
    {
      command: 'node scripts/serve-admin-test.mjs',
      url: `http://127.0.0.1:${adminPort}/admin-api/auth.php?action=session`,
      reuseExistingServer: false,
      timeout: 60000
    }
  ]
})
