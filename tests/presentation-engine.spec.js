import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const PE_URL = '/presentation-engine.html';

// ── Public tests (no auth needed) ─────────────────────────────
test.describe('Data Files (public)', () => {

  test('styles.json loads and has correct structure', async ({ page }) => {
    const response = await page.goto('/data/styles.json');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty('styles');
    expect(json.styles.length).toBeGreaterThan(0);
    expect(json.styles[0]).toHaveProperty('name');
    expect(json.styles[0]).toHaveProperty('palette');
  });

  test('diagram library JSON loads with correct structure', async ({ page }) => {
    const response = await page.goto('/data/diagram-library.json');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty('diagrams');
    expect(json.diagrams.length).toBeGreaterThan(0);
    expect(json.diagrams[0]).toHaveProperty('file');
    expect(json.diagrams[0]).toHaveProperty('category');
    expect(json.diagrams[0]).toHaveProperty('pattern');
  });

  test('diagram images are accessible', async ({ page }) => {
    const response = await page.goto('/data/diagram-library.json');
    const json = await response.json();
    const diagrams = json.diagrams;
    const basePath = json.basePath || '/images/diagrams/';

    for (const d of diagrams.slice(0, 5)) {
      const imgRes = await page.goto(`${basePath}${d.file}`);
      expect(imgRes.status(), `Diagram image missing: ${d.file}`).toBe(200);
    }
  });
});

// ── Authenticated tests (require auth-setup first) ────────────
// Run `node tests/auth-setup.js` once to save your Google SSO session.
// Playwright config auto-loads .auth/state.json if present.

test.describe('Presentation Engine', () => {

  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(path.resolve('.auth/state.json'))) {
      test.skip('Run `node tests/auth-setup.js` first to authenticate');
      return;
    }
    await page.goto(PE_URL, { waitUntil: 'networkidle' });
    // Verify we reached the actual page, not a redirect
    const title = await page.title();
    if (title.includes('Sign In')) {
      test.skip('Auth session expired — run `node tests/auth-setup.js` again');
    }
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Presentation Engine/);
  });

  test('input and preview panels render', async ({ page }) => {
    await expect(page.locator('.input-panel')).toBeVisible();
    await expect(page.locator('.preview-panel')).toBeVisible();
  });

  test('Contract Parser module initializes', async ({ page }) => {
    await expect(page.locator('.cp-container')).toBeVisible();
    await expect(page.locator('.cp-toggle-btn')).toHaveText('Upload Document');
  });

  test('materials load into style dropdown', async ({ page }) => {
    const styleSelect = page.locator('#design-style');
    await expect(styleSelect.locator('option')).not.toHaveCount(0, { timeout: 10000 });
    const count = await styleSelect.locator('option').count();
    expect(count).toBeGreaterThan(1);
  });

  test('default rooms are created', async ({ page }) => {
    const roomSections = page.locator('.room-section');
    await expect(roomSections.first()).toBeVisible({ timeout: 10000 });
    const count = await roomSections.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('html2pdf library is loaded', async ({ page }) => {
    const hasHtml2pdf = await page.evaluate(() => typeof html2pdf === 'function');
    expect(hasHtml2pdf).toBe(true);
  });

  test('download buttons exist', async ({ page }) => {
    await expect(page.locator('#download-pdf-btn')).toBeVisible();
    await expect(page.locator('#download-signoff-btn')).toBeVisible();
  });

  test('toggle shows/hides upload dropzone', async ({ page }) => {
    const toggleBtn = page.locator('.cp-toggle-btn');
    const body = page.locator('.cp-body');

    await expect(body).not.toHaveClass(/cp-visible/);
    await toggleBtn.click();
    await expect(body).toHaveClass(/cp-visible/);
    await toggleBtn.click();
    await expect(body).not.toHaveClass(/cp-visible/);
  });
});

// ── Contract Parser Upload ────────────────────────────────────
test.describe('Contract Parser — Upload', () => {

  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(path.resolve('.auth/state.json'))) {
      test.skip('Run `node tests/auth-setup.js` first');
      return;
    }
    await page.goto(PE_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    if (title.includes('Sign In')) {
      test.skip('Auth session expired');
    }
  });

  test('upload change order and verify extraction', async ({ page }) => {
    // Find test file
    const candidates = [
      ...fs.existsSync(path.resolve('reference'))
        ? fs.readdirSync(path.resolve('reference'))
            .filter(f => /\.(pdf|docx|xlsx|png|jpg)$/i.test(f))
            .map(f => path.resolve('reference', f))
        : [],
      path.resolve('CHANGE ORDER EXAMPLE.pdf'),
    ];

    const testFile = candidates.find(f => fs.existsSync(f));
    if (!testFile) {
      test.skip('No test document found');
      return;
    }

    // Open upload section
    await page.locator('.cp-toggle-btn').click();
    await expect(page.locator('.cp-body')).toHaveClass(/cp-visible/);

    // Upload the file
    await page.locator('.cp-file-input').setInputFiles(testFile);

    // Wait for processing spinner
    await expect(page.locator('.cp-status')).toHaveClass(/cp-active/, { timeout: 5000 });

    // Wait for confirmation overlay (Gemini processing can take up to 90s)
    await expect(page.locator('.cp-confirm-overlay')).toHaveClass(/cp-active/, { timeout: 90_000 });

    // 7 buyer fields should be rendered
    const buyerInputs = page.locator('[data-buyer-key]');
    expect(await buyerInputs.count()).toBe(7);

    // At least some fields should have values
    let filled = 0;
    for (let i = 0; i < await buyerInputs.count(); i++) {
      const val = await buyerInputs.nth(i).inputValue();
      if (val?.trim()) filled++;
    }
    expect(filled).toBeGreaterThan(0);

    // Confirm and populate
    await page.locator('.cp-btn-confirm').click();
    await expect(page.locator('.cp-confirm-overlay')).not.toHaveClass(/cp-active/);

    // Verify fields populated
    const projectName = await page.locator('#project-name').inputValue();
    expect(projectName.length).toBeGreaterThan(0);
  });
});
