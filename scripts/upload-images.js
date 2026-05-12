const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Config ──────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://eqqllaiswgkoxrivgmig.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWxsYWlzd2drb3hyaXZnbWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ2Njk2MCwiZXhwIjoyMDkyMDQyOTYwfQ.CWsC6YZAzxi7U6yg9gPt1uymoN_KiuQgcjItY62TUpM';
const BUCKET = 'material-images';
const BATCH_SIZE = 5;
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB limit

const DATA_PATH = path.join(__dirname, '..', 'data', 'material-image-urls.json');

// ── Helpers ─────────────────────────────────────────────────────────────

function isDirectImageUrl(url) {
  const lower = url.toLowerCase();
  // Check for image file extensions
  if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(lower)) return true;
  // Known CDN patterns that serve images directly
  if (lower.includes('/cdn/shop/') && (lower.includes('products/') || lower.includes('files/'))) return true;
  if (lower.includes('bigcommerce.com')) return true;
  if (lower.includes('marble.com/uploads/')) return true;
  if (lower.includes('hardwarehut.com/images/')) return true;
  return false;
}

function getContentType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  return 'image/jpeg'; // default
}

function getExtension(url, contentType) {
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return '.png';
  if (lower.includes('.webp')) return '.webp';
  if (lower.includes('.gif')) return '.gif';
  if (contentType && contentType.includes('png')) return '.png';
  if (contentType && contentType.includes('webp')) return '.webp';
  return '.jpg';
}

function sanitizeFilename(sku) {
  return sku.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function downloadImage(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*'
      },
      timeout: 15000
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        return downloadImage(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
        res.resume();
        return reject(new Error(`Not an image: ${contentType}`));
      }

      const chunks = [];
      let totalSize = 0;

      res.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > 2 * 1024 * 1024) { // 2MB hard limit
          res.destroy();
          reject(new Error('Image too large (>2MB)'));
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', () => {
        resolve({ buffer: Buffer.concat(chunks), contentType });
      });

      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function supabaseRequest(method, path, body, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': contentType,
      },
      timeout: 30000
    };

    if (method === 'PATCH') {
      options.headers['Prefer'] = 'return=minimal';
    }

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, body: text, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });

    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function uploadToStorage(filename, buffer, contentType) {
  const res = await supabaseRequest(
    'POST',
    `/storage/v1/object/${BUCKET}/${filename}`,
    buffer,
    contentType
  );

  // If file exists, try upsert
  if (res.status === 400 && res.body.includes('already exists')) {
    const res2 = await supabaseRequest(
      'PUT',
      `/storage/v1/object/${BUCKET}/${filename}`,
      buffer,
      contentType
    );
    if (res2.status !== 200) {
      throw new Error(`Upload upsert failed: ${res2.status} ${res2.body}`);
    }
    return;
  }

  if (res.status !== 200) {
    throw new Error(`Upload failed: ${res.status} ${res.body}`);
  }
}

function getPublicUrl(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function updateMaterialImageUrl(sku, imageUrl) {
  const encodedSku = encodeURIComponent(sku);
  const res = await supabaseRequest(
    'PATCH',
    `/rest/v1/materials?sku=eq.${encodedSku}`,
    JSON.stringify({ image_url: imageUrl }),
    'application/json'
  );

  if (res.status !== 200 && res.status !== 204) {
    throw new Error(`DB update failed for ${sku}: ${res.status} ${res.body}`);
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function processBatch(items, batchNum, totalBatches) {
  const results = await Promise.allSettled(items.map(async (item) => {
    const { sku, image_url, name } = item;
    const isDirect = isDirectImageUrl(image_url);

    if (isDirect) {
      try {
        const { buffer, contentType } = await downloadImage(image_url);
        const ext = getExtension(image_url, contentType);
        const filename = `${sanitizeFilename(sku)}${ext}`;
        const uploadContentType = getContentType(image_url);

        await uploadToStorage(filename, buffer, uploadContentType);
        const publicUrl = getPublicUrl(filename);
        await updateMaterialImageUrl(sku, publicUrl);

        const sizeKB = (buffer.length / 1024).toFixed(1);
        return { sku, status: 'uploaded', size: `${sizeKB}KB`, name };
      } catch (err) {
        // Fallback: store original URL
        try {
          await updateMaterialImageUrl(sku, image_url);
          return { sku, status: 'fallback-original', error: err.message, name };
        } catch (dbErr) {
          return { sku, status: 'failed', error: `${err.message} + DB: ${dbErr.message}`, name };
        }
      }
    } else {
      // Product page URL -- store as-is
      try {
        await updateMaterialImageUrl(sku, image_url);
        return { sku, status: 'page-url', name };
      } catch (err) {
        return { sku, status: 'failed', error: err.message, name };
      }
    }
  }));

  return results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason?.message });
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reading image URL data...');
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const items = data.images;

  console.log(`Total materials: ${items.length}`);

  const directItems = items.filter(i => isDirectImageUrl(i.image_url));
  const pageItems = items.filter(i => !isDirectImageUrl(i.image_url));

  console.log(`Direct CDN images: ${directItems.length}`);
  console.log(`Product page URLs: ${pageItems.length}`);
  console.log('');

  const allItems = [...directItems, ...pageItems];
  const allResults = [];

  const totalBatches = Math.ceil(allItems.length / BATCH_SIZE);

  for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
    const batch = allItems.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`Batch ${batchNum}/${totalBatches} (${batch.map(b => b.sku).join(', ')})`);

    const results = await processBatch(batch, batchNum, totalBatches);
    allResults.push(...results);

    // Brief pause between batches to be nice to APIs
    if (i + BATCH_SIZE < allItems.length) {
      await sleep(300);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('RESULTS SUMMARY');
  console.log('═══════════════════════════════════════');

  const uploaded = allResults.filter(r => r.status === 'uploaded');
  const pageUrls = allResults.filter(r => r.status === 'page-url');
  const fallbacks = allResults.filter(r => r.status === 'fallback-original');
  const failed = allResults.filter(r => r.status === 'failed' || r.status === 'error');

  console.log(`Uploaded to storage:   ${uploaded.length}`);
  console.log(`Page URLs stored:      ${pageUrls.length}`);
  console.log(`Fallback (orig URL):   ${fallbacks.length}`);
  console.log(`Failed:                ${failed.length}`);
  console.log(`Total processed:       ${allResults.length}`);

  if (uploaded.length > 0) {
    console.log('\n── Uploaded Images ──');
    uploaded.forEach(r => console.log(`  ✓ ${r.sku} (${r.size}) - ${r.name}`));
  }

  if (fallbacks.length > 0) {
    console.log('\n── Fallbacks (download failed, stored original URL) ──');
    fallbacks.forEach(r => console.log(`  ~ ${r.sku}: ${r.error}`));
  }

  if (failed.length > 0) {
    console.log('\n── Failed ──');
    failed.forEach(r => console.log(`  ✗ ${r.sku}: ${r.error}`));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
