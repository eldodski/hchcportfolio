// Insert kitchen inventory materials into Supabase
// Run from Ena/ folder: node scripts/insert-kitchen-inventory.js
//
// This script:
// 1. Deletes ALL existing cabinetry, hardware, and lighting materials
// 2. Inserts fresh data from kitchen-inventory.json
// 3. Uses local image paths (served from Vercel CDN)

const SUPABASE_URL = 'https://eqqllaiswgkoxrivgmig.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWxsYWlzd2drb3hyaXZnbWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjY5NjAsImV4cCI6MjA5MjA0Mjk2MH0.D8KuzcRktLom6lTL7QChPih8CmZaThEpjy5lGYl-ZAM';

async function supabaseRequest(method, path, body) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }
  if (method === 'POST') return res.json();
  return null;
}

function buildMaterials() {
  const materials = [];

  // ========== TIMBERLAKE CABINETRY ==========
  const timberlakeDoors = [
    {
      name: 'Charleston', image: 'images/cabinetry/charleston.png',
      paints: ['Linen','Pewter Glaze','Vanilla','Biscotti Glaze','Harbor','Ember Glaze','Stone','Boulder','Oat','Sage','Mist','Navy','Black'],
      maple: ['Rye','Almond','Cider','Latte','Truffle','Slate'],
      cherry: ['Amber','Clove']
    },
    {
      name: 'Sierra Vista', image: 'images/cabinetry/sierra-vista.png',
      paints: ['Linen','Pewter Glaze','Vanilla','Biscotti Glaze','Harbor','Ember Glaze','Stone','Boulder','Oat','Sage','Mist','Navy','Black'],
      maple: ['Rye','Almond','Cider','Latte','Truffle','Slate'],
      cherry: ['Amber','Clove']
    },
    {
      name: 'New Haven', image: 'images/cabinetry/new-haven.png',
      paints: ['Linen','Vanilla','Harbor','Stone','Boulder','Oat','Sage','Mist','Navy','Black'],
      maple: ['Rye','Almond','Cider','Latte','Truffle','Slate'],
      cherry: ['Amber','Clove']
    },
    {
      name: 'Madera', image: 'images/cabinetry/madera.png',
      paints: ['Linen','Pewter Glaze','Vanilla','Biscotti Glaze','Harbor','Ember Glaze','Stone','Boulder','Oat','Sage','Mist','Navy','Black'],
      maple: ['Rye','Almond','Cider','Latte','Truffle','Slate']
    },
    {
      name: 'Maddox', image: 'images/cabinetry/maddox.png',
      paints: ['Linen','Pewter Glaze','Vanilla','Biscotti Glaze','Harbor','Ember Glaze','Stone','Boulder','Oat','Sage','Mist','Navy','Black'],
      maple: ['Rye','Almond','Cider','Latte','Truffle','Slate']
    },
    {
      name: 'Sonoma', image: 'images/cabinetry/sonoma.png',
      paints: ['Linen','Vanilla','Harbor','Stone','Oat','Sage','Mist','Navy','Black'],
      maple: ['Rye','Almond','Cider','Latte','Truffle','Slate'],
      cherry: ['Amber','Clove'],
      duraform: ['Linen','Harbor','Stone','Espresso']
    },
    {
      name: 'Barnett', image: 'images/cabinetry/barnett.png',
      paints: ['Linen','Vanilla','Harbor','Stone','Oat','Sage','Mist','Navy','Black'],
      maple: ['Rye','Almond','Cider','Latte','Truffle','Slate'],
      duraform: ['Linen','Harbor','Stone','Espresso']
    },
    {
      name: 'Downing', image: 'images/cabinetry/downing.png',
      duraform: ['Linen','Harbor','Stone','Espresso']
    },
    {
      name: 'Fairfield', image: 'images/cabinetry/fairfield.png',
      hardwood: ['Rye','Truffle']
    }
  ];

  for (const door of timberlakeDoors) {
    if (door.paints) {
      for (const color of door.paints) {
        materials.push({
          name: `${door.name} - ${color}`,
          category: 'cabinetry',
          vendor: 'Timberlake',
          series: door.name,
          color: color,
          image_url: door.image,
          material_type: 'Paint'
        });
      }
    }
    if (door.maple) {
      for (const color of door.maple) {
        materials.push({
          name: `${door.name} - ${color} (Maple)`,
          category: 'cabinetry',
          vendor: 'Timberlake',
          series: door.name,
          color: `${color} (Maple)`,
          image_url: door.image,
          material_type: 'Stain'
        });
      }
    }
    if (door.cherry) {
      for (const color of door.cherry) {
        materials.push({
          name: `${door.name} - ${color} (Cherry)`,
          category: 'cabinetry',
          vendor: 'Timberlake',
          series: door.name,
          color: `${color} (Cherry)`,
          image_url: door.image,
          material_type: 'Stain'
        });
      }
    }
    if (door.duraform) {
      for (const color of door.duraform) {
        materials.push({
          name: `${door.name} - ${color} (Duraform)`,
          category: 'cabinetry',
          vendor: 'Timberlake',
          series: door.name,
          color: `${color} (Duraform)`,
          image_url: door.image,
          material_type: 'Duraform'
        });
      }
    }
    if (door.hardwood) {
      for (const color of door.hardwood) {
        materials.push({
          name: `${door.name} - ${color} (Hardwood)`,
          category: 'cabinetry',
          vendor: 'Timberlake',
          series: door.name,
          color: `${color} (Hardwood)`,
          image_url: door.image,
          material_type: 'Hardwood'
        });
      }
    }
  }

  // ========== KENTMORE (KMC) CABINETRY ==========
  const kmcDoors = [
    'American', 'American CNC', 'Contemporary', 'Florence', 'Groveland',
    'Lexington', 'Mission', 'Mission V-Groove', 'Sentinel', 'Shelburne',
    'Strausmor', 'Trenton', 'Tuscany', 'Village', 'Windsor'
  ];
  const kmcImages = {
    'American': 'images/cabinetry/kmc-doors/american.jpg',
    'American CNC': 'images/cabinetry/kmc-doors/american-cnc.jpg',
    'Contemporary': 'images/cabinetry/kmc-doors/contemporary.jpg',
    'Florence': 'images/cabinetry/kmc-doors/florence.png',
    'Groveland': 'images/cabinetry/kmc-doors/groveland.jpg',
    'Lexington': 'images/cabinetry/kmc-doors/lexington.jpg',
    'Mission': 'images/cabinetry/kmc-doors/mission.jpg',
    'Mission V-Groove': 'images/cabinetry/kmc-doors/mission-vgroove.jpg',
    'Sentinel': 'images/cabinetry/kmc-doors/sentinel.jpg',
    'Shelburne': 'images/cabinetry/kmc-doors/shelburne.jpg',
    'Strausmor': 'images/cabinetry/kmc-doors/strausmor.png',
    'Trenton': 'images/cabinetry/kmc-doors/trenton.jpg',
    'Tuscany': 'images/cabinetry/kmc-doors/tuscany.jpg',
    'Village': 'images/cabinetry/kmc-doors/village.jpg',
    'Windsor': 'images/cabinetry/kmc-doors/windsor.jpg'
  };
  const kmcStains = ['Wheat','Natural','Honey','Amber','Cider','Chestnut','Fruitwood','Espresso','Coffee','Bark','Driftwood','Knotty Alder Natural','White Shoji','Discerning Beige','Ocean Obsidian'];
  const kmcPaints = ['Pure White','Antique White','Linen','Dove White','Gray Mist','Silver','Graphite','Sage','Black','Navy','Slate Blue','Agreeable Gray','Simply White','Cloud White','Greige'];

  for (const door of kmcDoors) {
    for (const color of kmcStains) {
      materials.push({
        name: `${door} - ${color}`,
        category: 'cabinetry',
        vendor: 'Kentmore',
        series: door,
        color: color,
        image_url: kmcImages[door],
        material_type: 'Stain'
      });
    }
    for (const color of kmcPaints) {
      materials.push({
        name: `${door} - ${color}`,
        category: 'cabinetry',
        vendor: 'Kentmore',
        series: door,
        color: color,
        image_url: kmcImages[door],
        material_type: 'Paint'
      });
    }
  }

  // ========== TIMBERLAKE HARDWARE ==========
  const pulls = [
    { name: 'Tempo Pull', image: 'images/hardware/tempo-pull.jpg' },
    { name: 'T-Bar Pull 5 5/16"', image: 'images/hardware/tbar-pull-5.jpg' },
    { name: 'T-Bar Pull 8 5/8"', image: 'images/hardware/tbar-pull-8.jpg' },
    { name: 'Marquise Pull 5 9/16"', image: 'images/hardware/marquise-pull-5.jpg' },
    { name: 'Marquise Pull 6 7/8"', image: 'images/hardware/marquise-pull-6.jpg' },
    { name: 'Rectangular Pull', image: 'images/hardware/rectangular-pull.jpg' },
    { name: 'Radiant Pull', image: 'images/hardware/radiant-pull.jpg' },
    { name: 'Classic Pull', image: 'images/hardware/classic-pull.jpg' },
    { name: 'Beaded Pull', image: 'images/hardware/beaded-pull.jpg' }
  ];
  for (const p of pulls) {
    materials.push({
      name: p.name,
      category: 'hardware',
      vendor: 'Timberlake',
      series: 'Pulls',
      color: p.name,
      image_url: p.image
    });
  }

  const knobs = [
    { name: 'Rectangular Knob', image: 'images/hardware/rectangular-knob.jpg' },
    { name: 'Radiant Knob', image: 'images/hardware/radiant-knob.jpg' },
    { name: 'Classic Knob', image: 'images/hardware/classic-knob.jpg' },
    { name: 'Halo Knob', image: 'images/hardware/halo-knob.jpg' }
  ];
  for (const k of knobs) {
    materials.push({
      name: k.name,
      category: 'hardware',
      vendor: 'Timberlake',
      series: 'Knobs',
      color: k.name,
      image_url: k.image
    });
  }

  // ========== KICHLER LIGHTING ==========
  const kichlerSeries = [
    { name: 'Everly', finishes: [
      { color: 'Black', image: 'images/lighting/everly-bk.jpg' },
      { color: 'Chrome', image: 'images/lighting/everly-ch.jpg' },
      { color: 'Natural Brass', image: 'images/lighting/everly-nbr.jpg' },
      { color: 'Olde Bronze', image: 'images/lighting/everly-oz.jpg' }
    ]},
    { name: 'Crosby', finishes: [
      { color: 'Black', image: 'images/lighting/crosby-bk.jpg' },
      { color: 'Natural Brass', image: 'images/lighting/crosby-nbr.jpg' },
      { color: 'Brushed Nickel', image: 'images/lighting/crosby-ni.jpg' },
      { color: 'Olde Bronze', image: 'images/lighting/crosby-oz.jpg' }
    ]},
    { name: 'Winslow', finishes: [
      { color: 'Black', image: 'images/lighting/winslow-bk.jpg' },
      { color: 'Natural Brass', image: 'images/lighting/winslow-nbr.jpg' },
      { color: 'Brushed Nickel', image: 'images/lighting/winslow-ni.jpg' }
    ]},
    { name: 'Shailene', finishes: [
      { color: 'Black', image: 'images/lighting/shailene-bk.jpg' },
      { color: 'Brushed Nickel', image: 'images/lighting/shailene-ni.jpg' },
      { color: 'Olde Bronze', image: 'images/lighting/shailene-oz.jpg' }
    ]},
    { name: 'Larkin', finishes: [
      { color: 'Black', image: 'images/lighting/larkin-bk.jpg' },
      { color: 'Olde Bronze', image: 'images/lighting/larkin-oz.jpg' }
    ]},
    { name: 'Jolie', finishes: [
      { color: 'Brushed Nickel', image: 'images/lighting/jolie-ni.jpg' },
      { color: 'Olde Bronze', image: 'images/lighting/jolie-oz.jpg' }
    ]},
    { name: 'Kitner', finishes: [
      { color: 'Natural Brass', image: 'images/lighting/kitner-nbr.jpg' },
      { color: 'Polished Nickel', image: 'images/lighting/kitner-pn.jpg' }
    ]},
    { name: 'Zailey', finishes: [
      { color: 'Black', image: 'images/lighting/zailey-bk.jpg' },
      { color: 'Natural Brass', image: 'images/lighting/zailey-nbr.jpg' },
      { color: 'White', image: 'images/lighting/zailey-wh.jpg' }
    ]}
  ];

  for (const series of kichlerSeries) {
    for (const finish of series.finishes) {
      materials.push({
        name: `${series.name} - ${finish.color}`,
        category: 'lighting',
        vendor: 'Kichler',
        series: series.name,
        color: finish.color,
        image_url: finish.image
      });
    }
  }

  return materials;
}

async function main() {
  const materials = buildMaterials();
  console.log(`Built ${materials.length} materials to insert`);

  // Count by category
  const counts = {};
  for (const m of materials) {
    counts[m.category] = (counts[m.category] || 0) + 1;
  }
  console.log('Breakdown:', counts);

  // Step 1: Delete existing cabinetry, hardware, and lighting materials
  console.log('\nDeleting existing cabinetry materials...');
  await supabaseRequest('DELETE', 'materials?category=eq.cabinetry');
  console.log('Deleting existing hardware materials...');
  await supabaseRequest('DELETE', 'materials?category=eq.hardware');
  console.log('Deleting existing lighting materials...');
  await supabaseRequest('DELETE', 'materials?category=eq.lighting');

  // Normalize: ensure all objects have the same keys
  const allKeys = new Set();
  for (const m of materials) Object.keys(m).forEach(k => allKeys.add(k));
  for (const m of materials) {
    for (const k of allKeys) {
      if (!(k in m)) m[k] = null;
    }
  }

  // Step 2: Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < materials.length; i += batchSize) {
    const batch = materials.slice(i, i + batchSize);
    await supabaseRequest('POST', 'materials', batch);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${materials.length}`);
  }

  console.log(`\nDone! Inserted ${inserted} materials.`);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
