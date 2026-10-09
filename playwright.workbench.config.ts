import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base,
  testMatch: ['**/workbench.spec.ts', '**/admin-preview.spec.ts'],
  use: { baseURL: 'http://127.0.0.1:3101', trace: 'retain-on-failure', contextOptions: { reducedMotion: process.env.MOTION ? 'no-preference' : 'reduce' } },
  webServer: { command: 'npm run dev -- --port 3101', url: 'http://127.0.0.1:3101', reuseExistingServer: false },
});
