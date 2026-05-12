const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const imageTimings = [];

  // Track all image requests
  page.on('response', async (response) => {
    const url = response.url();
    const ct = response.headers()['content-type'] || '';
    if (ct.startsWith('image/') || url.match(/\.(png|jpg|jpeg|webp|svg|gif)(\?|$)/i)) {
      const timing = response.request().timing();
      const size = response.headers()['content-length'];
      imageTimings.push({
        url: url.replace('https://hillcountryhomeconcepts.com/', ''),
        status: response.status(),
        size: size ? (parseInt(size) / 1024).toFixed(0) + 'KB' : '??',
        contentType: ct,
        totalMs: Math.round(timing.responseEnd)
      });
    }
  });

  const start = Date.now();
  await page.goto('https://hillcountryhomeconcepts.com', { waitUntil: 'load', timeout: 60000 });
  const loadTime = Date.now() - start;
  // Wait a bit more for lazy images
  await page.waitForTimeout(5000);
  const totalLoad = Date.now() - start;

  console.log(`Page load (networkidle): ${totalLoad}ms\n`);
  console.log('=== IMAGE LOAD TIMES ===');

  // Sort slowest first
  imageTimings.sort((a, b) => b.totalMs - a.totalMs);
  for (const img of imageTimings) {
    const flag = img.totalMs > 500 ? ' <<<< SLOW' : '';
    console.log(`${String(img.totalMs).padStart(6)}ms  ${img.size.padStart(7)}  ${img.url}${flag}`);
  }

  console.log(`\nTotal images: ${imageTimings.length}`);

  await browser.close();
})();
