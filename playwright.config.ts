import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: ['**/entry.spec.ts', '**/fixtures.spec.ts', '**/memory.spec.ts', '**/admin-security.spec.ts'], fullyParallel: true, forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure', contextOptions: { reducedMotion: process.env.MOTION ? 'no-preference' : 'reduce' } },
  webServer: { command: 'npm run start -- --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false },
  projects: [
    { name: 'narrow-mobile', use: { viewport: { width: 320, height: 740 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } }
  ]
});
