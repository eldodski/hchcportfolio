/**
 * Upload remaining product images to Supabase storage.
 *
 * Targets only the 67 materials that were updated from vendor page URLs
 * to direct CDN URLs (identified by having an `original_page_url` field).
 *
 * Uses the same upload pattern as upload-images.js:
 * 1. Download image from CDN URL
 * 2. Upload to Supabase material-images bucket
 * 3. Update the materials table image_url via REST API
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Config ──────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://eqqllaiswgkoxrivgmig.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWxsYWlzd2drb3hyaXZnbWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ2Njk2MCwiZXhwIjoyMDkyMDQyOTYwfQ.CWsC6YZAzxi7U6yg9gPt1uymoN_KiuQgcjItY62TUpM';
const BUCKET = 'material-images';
const BATCH_SIZE = 5;

const DATA_PATH = path.join(__dirname, '..', 'data', 'material-image-urls.json');

// ── Helpers ─────────────────────────────────────────────────────────────

function sanitizeFilename(sku) {
  return sku.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getContentType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('.png') || lower.includes('PNGServlet')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function getExtension(url, contentType) {
  const lower = url.toLowerCase();
  if (lower.includes('.png') || lower.includes('PNGServlet')) return '.png';
  if (lower.includes('.webp')) return '.webp';
  if (lower.includes('.gif')) return '.gif';
  if (contentType && contentType.includes('png')) return '.png';
  if (contentType && contentType.includes('webp')) return '.webp';
  return '.jpg';
}

function downloadImage(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*'
      },
      timeout: 20000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        res.resume();
        return downloadImage(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const contentType = res.headers['content-type'] || '';
      const chunks = [];
      let totalSize = 0;

      res.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > 2 * 1024 * 1024) {
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

function supabaseRequest(method, reqPath, body, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, SUPABASE_URL);
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reading material image URL data...');
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  // Target only items with original_page_url (the 67 we just updated)
  const targetItems = data.images.filter(i => i.original_page_url);
  console.log(`Found ${targetItems.length} materials with updated image URLs to upload\n`);

  const allResults = [];
  const totalBatches = Math.ceil(targetItems.length / BATCH_SIZE);

  for (let i = 0; i < targetItems.length; i += BATCH_SIZE) {
    const batch = targetItems.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\nBatch ${batchNum}/${totalBatches}`);

    const results = await Promise.allSettled(batch.map(async (item) => {
      const { sku, image_url, name } = item;
      console.log(`  Downloading: ${name} (${sku})`);

      try {
        const { buffer, contentType } = await downloadImage(image_url);
        const ext = getExtension(image_url, contentType);
        const filename = `${sanitizeFilename(sku)}${ext}`;
        const uploadContentType = getContentType(image_url);

        console.log(`  Uploading: ${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
        await uploadToStorage(filename, buffer, uploadContentType);

        const publicUrl = getPublicUrl(filename);
        await updateMaterialImageUrl(sku, publicUrl);

        return { sku, name, status: 'uploaded', size: `${(buffer.length / 1024).toFixed(1)}KB`, publicUrl };
      } catch (err) {
        // Fallback: store the CDN URL directly in the database
        console.log(`  Download failed (${err.message}), storing CDN URL directly`);
        try {
          await updateMaterialImageUrl(sku, image_url);
          return { sku, name, status: 'cdn-url-stored', error: err.message };
        } catch (dbErr) {
          return { sku, name, status: 'failed', error: `${err.message} + DB: ${dbErr.message}` };
        }
      }
    }));

    for (const r of results) {
      allResults.push(r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason?.message });
    }

    if (i + BATCH_SIZE < targetItems.length) {
      await sleep(500);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('UPLOAD RESULTS SUMMARY');
  console.log('='.repeat(60));

  const uploaded = allResults.filter(r => r.status === 'uploaded');
  const cdnStored = allResults.filter(r => r.status === 'cdn-url-stored');
  const failed = allResults.filter(r => r.status === 'failed' || r.status === 'error');

  console.log(`Uploaded to Supabase storage: ${uploaded.length}`);
  console.log(`CDN URL stored in DB:         ${cdnStored.length}`);
  console.log(`Failed:                       ${failed.length}`);
  console.log(`Total processed:              ${allResults.length}`);

  if (uploaded.length > 0) {
    console.log('\n-- Uploaded --');
    uploaded.forEach(r => console.log(`  OK  ${r.sku} (${r.size}) - ${r.name}`));
  }

  if (cdnStored.length > 0) {
    console.log('\n-- CDN URL Stored (download failed, using CDN URL directly) --');
    cdnStored.forEach(r => console.log(`  ~   ${r.sku}: ${r.error} - ${r.name}`));
  }

  if (failed.length > 0) {
    console.log('\n-- Failed --');
    failed.forEach(r => console.log(`  X   ${r.sku}: ${r.error}`));
  }

  // Write results log
  const logPath = path.join(__dirname, '..', 'data', 'upload-remaining-results.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: allResults,
    summary: {
      uploaded: uploaded.length,
      cdn_stored: cdnStored.length,
      failed: failed.length,
      total: allResults.length
    }
  }, null, 2));
  console.log(`\nResults log saved to: ${logPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
