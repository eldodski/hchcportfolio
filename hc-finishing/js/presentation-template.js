// HC Finishing — Presentation Template Generator
// Produces print-ready branded HTML from parsed order form data
// Adapted from HCHC presentation-template.js

function generatePresentationHTML(data) {
  const {
    builder_name = '',
    project_name = '',
    lot_number = '',
    address = '',
    rooms = [],
    designer_name = 'Ena Dodski',
    company_name = 'Hill Country Home Concepts'
  } = data;

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const totalMaterials = rooms.reduce((sum, r) => sum + r.materials.length, 0);

  const roomPages = rooms.map((room, i) => buildRoomPage(room, i)).join('');
  const summaryPage = buildSummaryPage(rooms, data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(project_name || 'Design Presentation')} | HC Finishing</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:ital,wght@0,200;0,300;0,400;1,200&display=swap" rel="stylesheet">
<style>
  @page { margin: 0; size: letter; }
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --ivory: #F5F0EB;
    --navy: #1B2A4A;
    --espresso: #3C2A21;
    --sand: #D4C5B2;
    --mocha: #A37762;
    --carrara: #E8E4E0;
    --gold: #C4A265;
  }

  body {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: 11pt;
    line-height: 1.6;
    color: var(--espresso);
    background: #fff;
  }

  .page {
    width: 8.5in;
    min-height: 11in;
    padding: 0.75in 1in;
    margin: 0 auto;
    page-break-after: always;
    position: relative;
  }

  .page:last-child { page-break-after: avoid; }

  @media screen {
    .page {
      box-shadow: 0 2px 20px rgba(0,0,0,0.08);
      margin-bottom: 1rem;
    }
  }

  /* Cover Page */
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(170deg, var(--navy) 0%, #2a3f6a 100%);
    color: white;
  }

  .cover-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 14pt;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 3rem;
  }

  .cover h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36pt;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 0.5rem;
  }

  .cover .subtitle {
    font-size: 14pt;
    font-weight: 300;
    color: var(--sand);
    margin-bottom: 3rem;
  }

  .cover-meta {
    font-size: 10pt;
    color: rgba(255,255,255,0.6);
    line-height: 1.8;
  }

  .cover-divider {
    width: 60px;
    height: 2px;
    background: var(--gold);
    margin: 2rem auto;
  }

  /* Room Pages */
  .room-page h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24pt;
    font-weight: 600;
    color: var(--navy);
    margin-bottom: 0.25rem;
  }

  .room-subtitle {
    font-size: 10pt;
    color: var(--mocha);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 1.5rem;
  }

  .divider {
    width: 40px;
    height: 2px;
    background: var(--gold);
    margin-bottom: 1.5rem;
  }

  .material-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
  }

  .material-table th {
    text-align: left;
    font-size: 8pt;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--mocha);
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--sand);
  }

  .material-table td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--carrara);
    font-size: 10pt;
    vertical-align: top;
  }

  .material-table tr:last-child td { border-bottom: none; }

  .cat-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: var(--carrara);
    color: var(--navy);
  }

  .tone-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
  }

  .tone-warm { background: #e65100; }
  .tone-cool { background: #1565c0; }
  .tone-neutral { background: #9e9e9e; }

  /* Summary Page */
  .summary-page h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24pt;
    color: var(--navy);
    margin-bottom: 0.25rem;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .summary-card {
    border: 1px solid var(--sand);
    padding: 1rem;
  }

  .summary-card h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 14pt;
    color: var(--navy);
    margin-bottom: 0.5rem;
  }

  .summary-card .stat {
    font-size: 28pt;
    font-family: 'Cormorant Garamond', serif;
    color: var(--navy);
  }

  .summary-card .label {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--mocha);
  }

  .next-steps {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--ivory);
    border-left: 3px solid var(--gold);
  }

  .next-steps h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 14pt;
    color: var(--navy);
    margin-bottom: 0.5rem;
  }

  .next-steps li {
    margin-left: 1.5rem;
    margin-bottom: 0.3rem;
    font-size: 10pt;
  }

  /* Footer */
  .page-footer {
    position: absolute;
    bottom: 0.5in;
    left: 1in;
    right: 1in;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: var(--sand);
    border-top: 1px solid var(--carrara);
    padding-top: 0.5rem;
  }

  .page-footer .brand { color: var(--gold); }

  @media print {
    body { background: white; }
    .page { box-shadow: none; margin: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<!-- Cover Page -->
<div class="page cover">
  <div class="cover-brand">HC Finishing</div>
  <h1>${esc(project_name) || 'Finish Selections'}</h1>
  <div class="subtitle">${esc(builder_name)}</div>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    ${lot_number ? `Lot ${esc(lot_number)}<br>` : ''}
    ${address ? `${esc(address)}<br>` : ''}
    <br>
    Prepared by ${esc(designer_name)}<br>
    ${esc(company_name)}<br>
    ${date}
  </div>
</div>

${roomPages}

${summaryPage}

</body>
</html>`;
}

function buildRoomPage(room, index) {
  const materialCount = room.materials.length;

  const rows = room.materials.map(m => {
    const tone = m.tone || guessTone(m);
    return `
      <tr>
        <td><span class="cat-badge">${esc(m.category)}</span></td>
        <td><strong>${esc(m.product)}</strong></td>
        <td>${esc(m.color) || '—'}</td>
        <td>${esc(m.quantity) || '—'}</td>
        <td>${m.notes ? esc(m.notes) : ''}</td>
      </tr>`;
  }).join('');

  return `
<div class="page room-page">
  <h2>${esc(room.name)}</h2>
  <div class="room-subtitle">${materialCount} material selection${materialCount !== 1 ? 's' : ''}</div>
  <div class="divider"></div>

  <table class="material-table">
    <thead>
      <tr>
        <th>Category</th>
        <th>Product</th>
        <th>Color / Finish</th>
        <th>Quantity</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="page-footer">
    <span class="brand">HC Finishing / SelectFlow</span>
    <span>${esc(room.name)}</span>
  </div>
</div>`;
}

function buildSummaryPage(rooms, data) {
  const totalMaterials = rooms.reduce((sum, r) => sum + r.materials.length, 0);
  const categories = [...new Set(rooms.flatMap(r => r.materials.map(m => m.category)))];

  return `
<div class="page summary-page">
  <h2>Selection Summary</h2>
  <div class="room-subtitle">Overview of all finish selections</div>
  <div class="divider"></div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="stat">${rooms.length}</div>
      <div class="label">Rooms</div>
    </div>
    <div class="summary-card">
      <div class="stat">${totalMaterials}</div>
      <div class="label">Total Selections</div>
    </div>
    <div class="summary-card">
      <div class="stat">${categories.length}</div>
      <div class="label">Material Categories</div>
    </div>
    <div class="summary-card">
      <h3>Rooms</h3>
      ${rooms.map(r => `<div style="font-size: 10pt; margin-bottom: 0.2rem;">${esc(r.name)} — ${r.materials.length} selections</div>`).join('')}
    </div>
  </div>

  <div class="next-steps">
    <h3>Next Steps</h3>
    <ol>
      <li>Review all material selections with the client.</li>
      <li>Confirm quantities and special order items.</li>
      <li>Schedule material procurement timeline.</li>
      <li>Coordinate installation schedule with builder.</li>
    </ol>
  </div>

  <div class="page-footer">
    <span class="brand">HC Finishing / SelectFlow</span>
    <span>Summary</span>
  </div>
</div>`;
}

function guessTone(material) {
  const text = `${material.product} ${material.color}`.toLowerCase();
  const warmWords = ['oak', 'walnut', 'brass', 'gold', 'bronze', 'copper', 'honey', 'warm', 'beige', 'cream', 'tan'];
  const coolWords = ['chrome', 'silver', 'nickel', 'blue', 'grey', 'gray', 'cool', 'ice', 'white', 'slate'];
  if (warmWords.some(w => text.includes(w))) return 'warm';
  if (coolWords.some(w => text.includes(w))) return 'cool';
  return 'neutral';
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
