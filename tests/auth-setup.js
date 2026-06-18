/**
 * Auth setup for Playwright tests.
 * Attempts programmatic Clerk sign-in, falls back to interactive browser.
 *
 * Run once: node tests/auth-setup.js
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '..', '.auth', 'state.json');

// Load env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

async function setup() {
  const email = process.env.HCHC_TEST_EMAIL;
  const password = process.env.HCHC_TEST_PASSWORD;

  console.log('Opening browser for Clerk sign-in...');
  console.log(`Email: ${email}`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  // Navigate to login page
  await page.goto('https://www.hillcountryhomeconcepts.com/login.html', {
    waitUntil: 'networkidle',
  });

  // Wait for Clerk sign-in widget
  console.log('Waiting for Clerk sign-in widget...');
  await page.waitForTimeout(3000);

  if (email && password) {
    try {
      // Try email+password flow
      console.log('Attempting email+password sign-in...');

      // Look for the email input in Clerk's widget
      const emailInput = page.locator('input[name="identifier"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      await emailInput.fill(email);

      // Click Continue
      const continueBtn = page.locator('button[data-localization-key="formButtonPrimary"]').first();
      await continueBtn.click();
      await page.waitForTimeout(2000);

      // Check if we got to password step or if there's a "Use another method" option
      const passwordInput = page.locator('input[name="password"]');
      const isPasswordVisible = await passwordInput.isVisible().catch(() => false);

      if (isPasswordVisible) {
        await passwordInput.fill(password);
        const signInBtn = page.locator('button[data-localization-key="formButtonPrimary"]').first();
        await signInBtn.click();

        // Wait for redirect
        await page.waitForURL(
          url => !url.pathname.includes('login'),
          { timeout: 30000 }
        );
        console.log('Password sign-in successful!');
      } else {
        // Google SSO only — fall through to manual
        console.log('Password auth not available. Falling back to manual sign-in.');
        console.log('Please sign in with Google in the browser window...');
        await page.waitForURL(
          url => !url.pathname.includes('login') && !url.hostname.includes('accounts.google'),
          { timeout: 300_000 }
        );
      }
    } catch (err) {
      console.log(`Auto sign-in failed: ${err.message}`);
      console.log('Please sign in manually in the browser window...');
      await page.waitForURL(
        url => !url.pathname.includes('login') && !url.hostname.includes('accounts.google'),
        { timeout: 300_000 }
      );
    }
  } else {
    console.log('No credentials in .env — sign in manually in the browser window...');
    await page.waitForURL(
      url => !url.pathname.includes('login') && !url.hostname.includes('accounts.google'),
      { timeout: 300_000 }
    );
  }

  // Let Clerk finalize session
  await page.waitForTimeout(3000);

  // Verify by loading presentation engine
  await page.goto('https://www.hillcountryhomeconcepts.com/presentation-engine.html', {
    waitUntil: 'networkidle',
  });

  const title = await page.title();
  if (title.includes('Sign In')) {
    console.error('Auth failed — still redirecting to sign-in. Try again.');
    await browser.close();
    process.exit(1);
  }

  console.log(`Authenticated! Page: "${title}"`);

  // Save auth state
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });

  console.log(`Auth state saved to: ${AUTH_FILE}`);
  console.log('Run tests with: npm test');

  await browser.close();
}

setup().catch(err => {
  console.error('Auth setup failed:', err);
  process.exit(1);
});
