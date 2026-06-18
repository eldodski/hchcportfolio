import { defineConfig } from '@playwright/test';
import fs from 'fs';

const authFile = '.auth/state.json';
const hasAuth = fs.existsSync(authFile);

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'https://www.hillcountryhomeconcepts.com',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // Use saved auth state if available
    ...(hasAuth ? { storageState: authFile } : {}),
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  reporter: [['list']],
});
