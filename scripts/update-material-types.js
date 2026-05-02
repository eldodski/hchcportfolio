// Populate material_type column for all existing materials
// Run AFTER supabase-migrations.sql (which adds the column)
// Usage: node scripts/update-material-types.js

const SUPABASE_URL = 'https://eqqllaiswgkoxrivgmig.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWxsYWlzd2drb3hyaXZnbWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjY5NjAsImV4cCI6MjA5MjA0Mjk2MH0.D8KuzcRktLom6lTL7QChPih8CmZaThEpjy5lGYl-ZAM';

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// Classification rules for flooring materials
function classifyFlooring(m) {
  const text = [m.name, m.series, m.vendor, m.description, m.color].filter(Boolean).join(' ').toLowerCase();

  // Lions Floor District/Pro/Max -> LVP
  if (m.vendor === 'Lions Floor') return 'LVP';
  if (/\b(lvp|lvt|vinyl\s*plank|luxury\s*vinyl|vinyl)\b/.test(text)) return 'LVP';
  if (/\b(engineered)\b/.test(text)) return 'Engineered';
  if (/\b(hardwood|solid\s*wood)\b/.test(text)) return 'Hardwood';
  if (/\b(laminate)\b/.test(text)) return 'Laminate';
  if (/\b(carpet)\b/.test(text)) return 'Carpet';
  if (/\b(tile|porcelain|ceramic|travertine|slate|mosaic)\b/.test(text)) return 'Tile';

  return null;
}

// Classification rules for backsplash/tile materials
function classifyTile(m) {
  const text = [m.name, m.series, m.vendor, m.description, m.color].filter(Boolean).join(' ').toLowerCase();
  const series = (m.series || '').toLowerCase();
  const vendor = (m.vendor || '').toLowerCase();

  // Arizona Tile Flash -> Wall Tile (>10% water absorption)
  if (vendor === 'arizona tile' && series === 'flash') return 'Wall Tile';

  // Emser Sterlina II -> Floor Tile (porcelain, rectified)
  if (vendor === 'emser' && /sterlina/i.test(series)) return 'Floor Tile';

  // Emser Brook II -> context-dependent, default to Wall Tile for small sizes
  if (vendor === 'emser' && /brook/i.test(series)) {
    if (/8\s*x\s*12|3\s*x\s*6|4\s*x\s*12/.test(text)) return 'Wall Tile';
    return 'Floor Tile';
  }

  // Emser Caru -> Floor Tile
  if (vendor === 'emser' && /caru/i.test(series)) return 'Floor Tile';

  // DalTile CF Advantage -> Floor Tile
  if (/daltile|dal\s*tile/i.test(vendor) && /cf\s*advantage|contempo/i.test(text)) return 'Floor Tile';

  // General classification by keywords
  if (/\bbacksplash\b/.test(text)) return 'Backsplash Tile';
  if (/\bdeco\b|\bdecorative\b|\bmosaic\b|\blistello\b/.test(text)) return 'Deco Tile';
  if (/\bwall\b|\b3x6\b|\b4x12\b|\b3x12\b|\bsubway\b/.test(text)) return 'Wall Tile';
  if (/\bfloor\b|\b12x24\b|\b24x24\b|\b18x18\b|\b13x13\b|\bporcelain\b|\brectified\b/.test(text)) return 'Floor Tile';

  return null;
}

async function run() {
  // Fetch all materials
  console.log('Fetching all materials...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/materials?select=*`, { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } });
  if (!res.ok) {
    console.error('Failed to fetch materials:', res.status, await res.text());
    return;
  }

  const materials = await res.json();
  console.log(`Found ${materials.length} materials`);

  let updated = 0;
  let skipped = 0;
  const updates = [];

  for (const m of materials) {
    // Skip if already has material_type or is edgeProtection (those get set by migration SQL)
    if (m.material_type || m.category === 'edgeProtection') {
      skipped++;
      continue;
    }

    let materialType = null;

    if (m.category === 'flooring') {
      materialType = classifyFlooring(m);
    } else if (m.category === 'backsplash') {
      materialType = classifyTile(m);
    }

    if (materialType) {
      updates.push({ id: m.id, material_type: materialType, name: m.name });
    }
  }

  console.log(`\nClassified ${updates.length} materials, skipping ${skipped} (already typed or non-applicable)\n`);

  // Batch update
  for (const u of updates) {
    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/materials?id=eq.${u.id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ material_type: u.material_type })
      }
    );

    if (patchRes.ok) {
      console.log(`  OK: ${u.name} -> ${u.material_type}`);
      updated++;
    } else {
      console.error(`  FAIL: ${u.name} -> ${patchRes.status}`);
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Unclassified: ${materials.length - updated - skipped}`);
}

run().catch(console.error);
