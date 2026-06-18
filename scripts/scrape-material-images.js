#!/usr/bin/env node
/**
 * Playwright-based Material Image Scraper
 *
 * Queries Supabase for materials with CDN reference URLs (not in Supabase storage),
 * uses Playwright to download the images (bypassing vendor CDN restrictions),
 * uploads them to Supabase storage, and updates the material records.
 *
 * Usage: node scripts/scrape-material-images.js [--dry-run] [--limit N]
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'material-images';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) || 999 : 999;

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${endpoint}: ${res.status} ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('json') ? res.json() : res.text();
}

async function getMaterialsWithCDNUrls() {
  // Get materials where image_url is a vendor CDN (not Supabase storage)
  const materials = await supabaseRequest(
    '/rest/v1/materials?select=id,name,category,image_url&image_url=not.is.null&order=id.asc',
  );
  return materials.filter(m =>
    m.image_url &&
    !m.image_url.includes('supabase.co') &&
    (m.image_url.startsWith('http://') || m.image_url.startsWith('https://'))
  ).slice(0, LIMIT);
}

async function uploadToSupabase(filename, buffer, contentType) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed for ${filename}: ${res.status} ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function updateMaterialImageUrl(id, newUrl) {
  await supabaseRequest(`/rest/v1/materials?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ image_url: newUrl }),
    headers: { 'Prefer': 'return=minimal' },
  });
}

function sanitizeFilename(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

async function main() {
  console.log('=== Material Image Scraper ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${LIMIT}`);
  console.log('');

  // Query materials
  console.log('Querying Supabase for materials with CDN URLs...');
  const materials = await getMaterialsWithCDNUrls();
  console.log(`Found ${materials.length} materials with vendor CDN URLs\n`);

  if (materials.length === 0) {
    console.log('No materials need image scraping. All good!');
    return;
  }

  if (DRY_RUN) {
    materials.forEach((m, i) => {
      console.log(`  ${i + 1}. [${m.category}] ${m.name}`);
      console.log(`     URL: ${m.image_url}`);
    });
    console.log(`\nDry run complete. ${materials.length} images would be scraped.`);
    return;
  }

  // Launch Playwright
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  });

  let success = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < materials.length; i++) {
    const mat = materials[i];
    const progress = `[${i + 1}/${materials.length}]`;

    try {
      console.log(`${progress} Downloading: ${mat.name}`);
      console.log(`         URL: ${mat.image_url}`);

      const page = await context.newPage();

      // Navigate to the image URL — Playwright handles cookies/JS challenges
      const response = await page.goto(mat.image_url, {
        waitUntil: 'load',
        timeout: 30000,
      });

      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status() || 'no response'}`);
      }

      // Get the image as a buffer
      const contentType = response.headers()['content-type'] || 'image/jpeg';
      const buffer = await response.body();

      if (buffer.length < 1000) {
        throw new Error(`Image too small (${buffer.length} bytes), likely an error page`);
      }

      // Determine extension from content type
      const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
      const ext = extMap[contentType.split(';')[0]] || 'jpg';
      const filename = `${sanitizeFilename(mat.name)}-${mat.id}.${ext}`;

      // Upload to Supabase storage
      const newUrl = await uploadToSupabase(filename, buffer, contentType.split(';')[0]);
      console.log(`         Uploaded: ${filename}`);

      // Update the material record
      await updateMaterialImageUrl(mat.id, newUrl);
      console.log(`         Updated DB record`);

      success++;
      await page.close();

      // Brief pause to be nice to vendor CDNs
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`${progress} FAILED: ${mat.name} — ${err.message}`);
      failed++;
      failures.push({ name: mat.name, url: mat.image_url, error: err.message });
    }
  }

  await browser.close();

  // Summary
  console.log('\n=== SCRAPE COMPLETE ===');
  console.log(`Success: ${success}`);
  console.log(`Failed:  ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailed materials:');
    failures.forEach(f => {
      console.log(`  - ${f.name}: ${f.error}`);
      console.log(`    URL: ${f.url}`);
    });
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
