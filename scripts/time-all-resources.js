const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const resources = [];

  page.on('response', async (response) => {
    const url = response.url();
    const timing = response.request().timing();
    const size = response.headers()['content-length'];
    const ct = response.headers()['content-type'] || '';
    resources.push({
      url: url.length > 100 ? url.substring(0, 100) + '...' : url,
      status: response.status(),
      size: size ? (parseInt(size) / 1024).toFixed(0) + 'KB' : '??',
      type: ct.split(';')[0],
      ms: Math.round(timing.responseEnd),
      resourceType: response.request().resourceType()
    });
  });

  const start = Date.now();
  await page.goto('https://hillcountryhomeconcepts.com', { waitUntil: 'load', timeout: 60000 });
  const loadTime = Date.now() - start;
  console.log(`DOMContentLoaded + load: ${loadTime}ms`);

  // Wait for remaining network
  await page.waitForTimeout(3000);
  const totalTime = Date.now() - start;
  console.log(`Total with settle: ${totalTime}ms`);

  // Sort by type then time
  resources.sort((a, b) => a.resourceType.localeCompare(b.resourceType) || b.ms - a.ms);

  console.log(`\n=== ALL RESOURCES (${resources.length}) ===`);
  let currentType = '';
  for (const r of resources) {
    if (r.resourceType !== currentType) {
      currentType = r.resourceType;
      console.log(`\n--- ${currentType} ---`);
    }
    console.log(`  ${String(r.status).padStart(3)} ${String(r.ms).padStart(6)}ms ${r.size.padStart(7)}  ${r.url}`);
  }
})();
