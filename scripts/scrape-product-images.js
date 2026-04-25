/**
 * Scrape product images from vendor page URLs.
 *
 * Strategy: Fetch each product page, extract og:image meta tag or
 * find direct image URLs in the HTML. Most vendor sites include
 * og:image tags that point to CDN-hosted product images.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_PATH = path.join(__dirname, '..', 'data', 'material-image-urls.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'scraped-image-results.json');

function isDirect(url) {
  const l = url.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(l)) return true;
  if (l.includes('/cdn/shop/') && (l.includes('products/') || l.includes('files/'))) return true;
  if (l.includes('bigcommerce.com')) return true;
  if (l.includes('marble.com/uploads/')) return true;
  if (l.includes('hardwarehut.com/images/')) return true;
  return false;
}

function fetchPage(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 20000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        } else if (!redirectUrl.startsWith('http')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}/${redirectUrl}`;
        }
        res.resume();
        return fetchPage(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const chunks = [];
      let totalSize = 0;
      res.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > 2 * 1024 * 1024) {
          res.destroy();
          reject(new Error('Page too large'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractImageUrl(html, pageUrl) {
  // Strategy 1: og:image meta tag (most reliable)
  const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
  if (ogMatch && ogMatch[1]) {
    let imgUrl = ogMatch[1];
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
    return { url: imgUrl, method: 'og:image' };
  }

  // Strategy 2: twitter:image meta tag
  const twMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
  if (twMatch && twMatch[1]) {
    let imgUrl = twMatch[1];
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
    return { url: imgUrl, method: 'twitter:image' };
  }

  // Strategy 3: JSON-LD product schema image
  const jsonLdMatches = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      const content = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        const data = JSON.parse(content);
        const img = data.image || (data['@graph'] && data['@graph'].find(g => g.image)?.image);
        if (img) {
          const imgUrl = Array.isArray(img) ? img[0] : (typeof img === 'string' ? img : img.url);
          if (imgUrl) return { url: imgUrl, method: 'json-ld' };
        }
      } catch(e) {}
    }
  }

  // Strategy 4: Look for large product images in specific patterns
  const hostname = new URL(pageUrl).hostname;

  // IKEA specific
  if (hostname.includes('ikea.com')) {
    const ikeaMatch = html.match(/https:\/\/www\.ikea\.com\/[^"'\s]+_(?:PH|PE)\d+[^"'\s]*\.(?:jpg|png|webp)/i);
    if (ikeaMatch) return { url: ikeaMatch[0].split('?')[0], method: 'ikea-pattern' };
  }

  // Home Depot specific
  if (hostname.includes('homedepot.com') || hostname.includes('thdstatic.com')) {
    const hdMatch = html.match(/https:\/\/images\.thdstatic\.com\/productImages\/[^"'\s]+\.(?:jpg|png|webp)/i);
    if (hdMatch) return { url: hdMatch[0], method: 'homedepot-cdn' };
  }

  // MSI surfaces
  if (hostname.includes('msisurfaces.com')) {
    const msiMatch = html.match(/https:\/\/[^"'\s]*msisurfaces\.com[^"'\s]*\/(?:product|slab|tile)[^"'\s]*\.(?:jpg|jpeg|png|webp)/i);
    if (msiMatch) return { url: msiMatch[0], method: 'msi-pattern' };
  }

  // Shopify CDN pattern
  const shopifyMatch = html.match(/https:\/\/[^"'\s]*\.shopify\.com\/s\/files\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/i)
    || html.match(/https:\/\/[^"'\s]*\/cdn\/shop\/(?:products|files)\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/i);
  if (shopifyMatch) return { url: shopifyMatch[0].split('"')[0].split("'")[0], method: 'shopify-cdn' };

  // Generic: first large image src
  const imgSrcMatch = html.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/i);
  if (imgSrcMatch) return { url: imgSrcMatch[1], method: 'first-img-src' };

  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const items = data.images;

  const pageItems = items.filter(i => !isDirect(i.image_url));
  console.log(`Found ${pageItems.length} items with page URLs to scrape\n`);

  const results = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < pageItems.length; i++) {
    const item = pageItems[i];
    const progress = `[${i + 1}/${pageItems.length}]`;

    try {
      console.log(`${progress} Fetching: ${item.name}`);
      console.log(`  URL: ${item.image_url}`);

      const html = await fetchPage(item.image_url);
      const extracted = extractImageUrl(html, item.image_url);

      if (extracted) {
        console.log(`  FOUND (${extracted.method}): ${extracted.url.substring(0, 100)}...`);
        results.push({
          sku: item.sku,
          name: item.name,
          category: item.category,
          original_url: item.image_url,
          new_image_url: extracted.url,
          method: extracted.method,
          status: 'found'
        });
        success++;
      } else {
        console.log(`  NOT FOUND - no image extracted`);
        results.push({
          sku: item.sku,
          name: item.name,
          category: item.category,
          original_url: item.image_url,
          new_image_url: null,
          method: null,
          status: 'not-found'
        });
        failed++;
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      results.push({
        sku: item.sku,
        name: item.name,
        category: item.category,
        original_url: item.image_url,
        new_image_url: null,
        method: null,
        status: 'error',
        error: err.message
      });
      failed++;
    }

    // Polite delay between requests
    if (i < pageItems.length - 1) {
      await sleep(500);
    }
  }

  // Write results
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ results, stats: { total: pageItems.length, success, failed } }, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`SCRAPING COMPLETE`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Success: ${success}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Total:   ${pageItems.length}`);
  console.log(`\nResults saved to: ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
