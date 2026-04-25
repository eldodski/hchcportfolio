// Presentation Template Generator for HCHC
// Produces a clean, print-ready HTML document organized by room

function generatePresentationHTML(data) {
  const { projectName, clientName, builderName, address, rooms, moodBoardUrl, report } = data;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Build room pages
  const roomPagesHTML = rooms.map(room => {
    if (room.type === 'kitchen') return buildKitchenPage(room);
    return buildBathroomPage(room);
  }).filter(Boolean).join('');

  // Mood board page
  const moodBoardHTML = moodBoardUrl ? `
    <div class="page mood-board-page">
      <span class="page-subheading">Mood Board</span>
      <h2>Design Inspiration</h2>
      <div class="divider"></div>
      <div class="mood-full">
        <img src="${moodBoardUrl}" alt="Mood board">
      </div>
    </div>` : '';

  // Concept summary text
  const conceptText = generateConceptText(rooms);

  // Summary page
  const summaryHTML = buildSummaryPage(rooms, report);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escT(projectName) || 'Design Presentation'} | HCHC</title>
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
    --dusty-blue: #7B9BAE;
  }

  body {
    font-family: 'Jost', 'Segoe UI', sans-serif;
    font-weight: 300;
    font-size: 11pt;
    line-height: 1.6;
    color: var(--espresso);
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  h1, h2, h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 600;
    color: var(--navy);
    line-height: 1.2;
  }

  .divider {
    width: 50px;
    height: 1px;
    background: var(--sand);
    margin: 16px 0 24px;
  }

  /* Cover Page */
  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: var(--ivory);
    padding: 60px;
    page-break-after: always;
  }

  .cover-brand {
    font-family: 'Jost', sans-serif;
    font-weight: 200;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--mocha);
    margin-bottom: 40px;
  }

  .cover h1 { font-size: 2.8rem; margin-bottom: 12px; }
  .cover-subtitle { font-size: 1rem; color: var(--mocha); margin-bottom: 8px; }
  .cover-builder { font-size: 0.9rem; color: var(--sand); margin-top: 4px; }
  .cover-meta { font-size: 0.85rem; color: var(--sand); margin-top: 48px; }

  /* Content Pages */
  .page {
    padding: 60px;
    page-break-after: always;
    min-height: 100vh;
  }

  .page h2 { font-size: 1.6rem; margin-bottom: 4px; }

  .page-subheading {
    font-size: 0.7rem;
    font-weight: 200;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--mocha);
    margin-bottom: 4px;
    display: block;
  }

  .room-type-badge {
    display: inline-block;
    font-size: 0.6rem;
    font-weight: 300;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dusty-blue);
    background: var(--ivory);
    padding: 2px 10px;
    margin-left: 8px;
    vertical-align: middle;
  }

  /* Concept Page */
  .concept-text {
    max-width: 580px;
    font-size: 0.95rem;
    line-height: 1.8;
    margin-top: 24px;
  }

  /* Materials Grid (Kitchen) */
  .materials-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-top: 32px;
  }

  .material-card {
    border: 1px solid var(--sand);
    overflow: hidden;
  }

  .material-img {
    width: 100%;
    aspect-ratio: 16/10;
    overflow: hidden;
  }

  .material-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .material-img-placeholder {
    background: var(--carrara);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sand);
    font-size: 0.9rem;
  }

  .material-info { padding: 14px 16px; }

  .material-category {
    font-size: 0.65rem;
    font-weight: 300;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mocha);
    margin-bottom: 2px;
  }

  .material-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 600;
    font-size: 1rem;
    color: var(--navy);
    margin-bottom: 4px;
  }

  .material-vendor { font-size: 0.78rem; color: var(--sand); }
  .material-tone { font-size: 0.75rem; color: var(--espresso); opacity: 0.7; }

  .material-install-notes {
    font-size: 0.75rem;
    color: var(--mocha);
    font-style: italic;
    margin-top: 4px;
  }

  /* Bathroom Spec Sheet */
  .spec-group {
    margin-bottom: 28px;
  }

  .spec-group-title {
    font-size: 0.7rem;
    font-weight: 300;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dusty-blue);
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--carrara);
  }

  .spec-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  .spec-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--carrara);
    vertical-align: top;
  }

  .spec-table td:first-child {
    font-weight: 400;
    color: var(--navy);
    white-space: nowrap;
    width: 160px;
  }

  .spec-table td:last-child {
    color: var(--espresso);
  }

  .spec-notes {
    font-size: 0.75rem;
    color: var(--mocha);
    font-style: italic;
    display: block;
    margin-top: 2px;
  }

  /* Mood Board */
  .mood-full { margin-top: 32px; }
  .mood-full img { width: 100%; max-height: 70vh; object-fit: contain; }

  /* Summary Page */
  .summary-section { margin-top: 32px; }
  .summary-section h3 { font-size: 1.1rem; margin-bottom: 12px; }

  .summary-list { list-style: none; padding: 0; }

  .summary-list li {
    padding: 8px 0;
    border-bottom: 1px solid var(--carrara);
    display: flex;
    justify-content: space-between;
    font-size: 0.88rem;
  }

  .summary-list li span:first-child {
    font-weight: 400;
    color: var(--navy);
  }

  .summary-notes {
    font-size: 0.75rem;
    color: var(--mocha);
    font-style: italic;
  }

  .room-summary-label {
    font-size: 0.68rem;
    font-weight: 300;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dusty-blue);
    margin-top: 20px;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--carrara);
  }

  .next-steps {
    background: var(--ivory);
    padding: 24px;
    margin-top: 32px;
  }

  .next-steps h3 { margin-bottom: 12px; }
  .next-steps ol { padding-left: 20px; font-size: 0.88rem; }
  .next-steps li { margin-bottom: 8px; }

  .presentation-footer {
    text-align: center;
    padding: 40px;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--sand);
    border-top: 1px solid var(--carrara);
    margin-top: 40px;
  }

  .compat-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 300;
    padding: 4px 12px;
    border-radius: 2px;
    margin-top: 16px;
  }

  .compat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover">
  <div class="cover-brand">Hill Country Home Concepts</div>
  <h1>${escT(projectName) || 'Design Presentation'}</h1>
  <p class="cover-subtitle">${clientName ? `Prepared for ${escT(clientName)}` : 'Interior Design Selections'}</p>
  ${builderName ? `<p class="cover-builder">Builder: ${escT(builderName)}</p>` : ''}
  ${address ? `<p class="cover-subtitle" style="font-size: 0.88rem; color: var(--sand);">${escT(address)}</p>` : ''}
  <p class="cover-meta">${date}</p>
</div>

<!-- Design Concept -->
<div class="page">
  <span class="page-subheading">Design Concept</span>
  <h2>Material Palette</h2>
  <div class="divider"></div>
  <p class="concept-text">${conceptText}</p>
</div>

<!-- Room Pages -->
${roomPagesHTML}

${moodBoardHTML}

<!-- Summary -->
${summaryHTML}

</body>
</html>`;
}

// ============================================================
// KITCHEN PAGE
// ============================================================
function buildKitchenPage(room) {
  const cards = [];

  room.flooring.forEach(f => {
    if (f.material) {
      cards.push(buildMaterialCard('Flooring' + (f.materialType ? ` (${f.materialType})` : ''), f.material, f.installNotes));
    }
  });

  const cats = ['cabinetry', 'countertops', 'backsplash', 'hardware', 'paint'];
  cats.forEach(cat => {
    if (room[cat] && room[cat].material) {
      cards.push(buildMaterialCard(capitalize(cat), room[cat].material, room[cat].installNotes));
    }
  });

  if (cards.length === 0) return '';

  return `
  <div class="page">
    <span class="page-subheading">${escT(room.label)}<span class="room-type-badge">Kitchen</span></span>
    <h2>Material Selections</h2>
    <div class="divider"></div>
    <div class="materials-grid">
      ${cards.join('')}
    </div>
  </div>`;
}

function buildMaterialCard(label, mat, notes) {
  return `
    <div class="material-card">
      ${mat.image_url
        ? `<div class="material-img"><img src="${mat.image_url}" alt="${escT(mat.name)}"></div>`
        : `<div class="material-img material-img-placeholder"><span>${escT(label)}</span></div>`
      }
      <div class="material-info">
        <div class="material-category">${escT(label)}</div>
        <div class="material-name">${escT(mat.name)}</div>
        ${mat.vendor ? `<div class="material-vendor">${escT(mat.vendor)}${mat.series ? ' &middot; ' + escT(mat.series) : ''}${mat.color ? ' &middot; ' + escT(mat.color) : ''}</div>` : ''}
        ${mat.tone ? `<div class="material-tone">Tone: ${capitalize(mat.tone)}</div>` : ''}
        ${notes ? `<div class="material-install-notes">Install: ${escT(notes)}</div>` : ''}
      </div>
    </div>`;
}

// ============================================================
// BATHROOM PAGE
// ============================================================
function buildBathroomPage(room) {
  let specGroups = '';

  // Water Fixtures
  const fixtureRows = [];
  room.waterFixtures.forEach((f, i) => {
    if (!f.type) return;
    fixtureRows.push(`<tr><td>Fixture ${i + 1}</td><td>${escT(f.type)}</td></tr>`);
    if (f.surroundTile && f.surroundTile.material) {
      fixtureRows.push(`<tr><td style="padding-left: 24px;">Surround Tile</td><td>${formatMaterialCell(f.surroundTile)}</td></tr>`);
    }
    if (f.floorTile && f.floorTile.material) {
      fixtureRows.push(`<tr><td style="padding-left: 24px;">Floor Tile</td><td>${formatMaterialCell(f.floorTile)}</td></tr>`);
    }
  });

  if (fixtureRows.length > 0) {
    specGroups += `
      <div class="spec-group">
        <div class="spec-group-title">Water Fixtures</div>
        <table class="spec-table">${fixtureRows.join('')}</table>
      </div>`;
  }

  // Niches & Details
  if (room.niches && (room.niches.styleName || room.niches.decorativeTile.material)) {
    const nicheRows = [];
    if (room.niches.styleName) nicheRows.push(`<tr><td>Niche Style</td><td>${escT(room.niches.styleName)}</td></tr>`);
    if (room.niches.shelfMaterial) nicheRows.push(`<tr><td>Shelf Material</td><td>${escT(room.niches.shelfMaterial)}</td></tr>`);
    if (room.niches.decorativeTile.material) nicheRows.push(`<tr><td>Decorative Tile</td><td>${formatMaterialCell(room.niches.decorativeTile)}</td></tr>`);
    nicheRows.push(`<tr><td>Placement</td><td>${escT(room.niches.placement)}</td></tr>`);

    specGroups += `
      <div class="spec-group">
        <div class="spec-group-title">Niches &amp; Details</div>
        <table class="spec-table">${nicheRows.join('')}</table>
      </div>`;
  }

  // Accents
  if (room.accents && room.accents.type !== 'None') {
    const accentRows = [];
    accentRows.push(`<tr><td>Type</td><td>${escT(room.accents.type)}</td></tr>`);
    if (room.accents.type === 'Linear') {
      accentRows.push(`<tr><td>Orientation</td><td>${escT(room.accents.orientation)}</td></tr>`);
      if (room.accents.width) accentRows.push(`<tr><td>Width</td><td>${escT(room.accents.width)}</td></tr>`);
    } else if (room.accents.type === 'Picture Frame') {
      if (room.accents.size) accentRows.push(`<tr><td>Size</td><td>${escT(room.accents.size)}</td></tr>`);
      accentRows.push(`<tr><td>Pencil Rail</td><td>${room.accents.pencilRail ? 'Yes' : 'No'}</td></tr>`);
      if (room.accents.interiorTile.material) {
        accentRows.push(`<tr><td>Interior Tile</td><td>${formatMaterialCell(room.accents.interiorTile)}</td></tr>`);
      }
    }

    specGroups += `
      <div class="spec-group">
        <div class="spec-group-title">Accent Details</div>
        <table class="spec-table">${accentRows.join('')}</table>
      </div>`;
  }

  // Tub Deck
  if (room.tubDeck && (room.tubDeck.skirtTile.material || room.tubDeck.deckTile.material || room.tubDeck.splashTile.material)) {
    const tubRows = [];
    if (room.tubDeck.skirtTile.material) tubRows.push(`<tr><td>Skirt Tile</td><td>${formatMaterialCell(room.tubDeck.skirtTile)}</td></tr>`);
    if (room.tubDeck.deckTile.material) tubRows.push(`<tr><td>Deck Tile</td><td>${formatMaterialCell(room.tubDeck.deckTile)}</td></tr>`);
    if (room.tubDeck.splashTile.material) tubRows.push(`<tr><td>Splash Tile</td><td>${formatMaterialCell(room.tubDeck.splashTile)}</td></tr>`);
    if (room.tubDeck.accentBandNotes) tubRows.push(`<tr><td>Accent Band</td><td>${escT(room.tubDeck.accentBandNotes)}</td></tr>`);

    specGroups += `
      <div class="spec-group">
        <div class="spec-group-title">Tub Deck</div>
        <table class="spec-table">${tubRows.join('')}</table>
      </div>`;
  }

  // Edge Protection
  if (room.edgeProtection && room.edgeProtection.type !== 'None') {
    const edgeRows = [];
    edgeRows.push(`<tr><td>Type</td><td>${escT(room.edgeProtection.type)}</td></tr>`);
    if (room.edgeProtection.type === 'Tile Edge' && room.edgeProtection.tileEdge.material) {
      edgeRows.push(`<tr><td>Tile Edge</td><td>${formatMaterialCell(room.edgeProtection.tileEdge)}</td></tr>`);
    } else if (room.edgeProtection.type === 'Accessory') {
      edgeRows.push(`<tr><td>Accessory Type</td><td>${escT(room.edgeProtection.accessoryType)}</td></tr>`);
      if (room.edgeProtection.accessory.material) {
        edgeRows.push(`<tr><td>Material</td><td>${formatMaterialCell(room.edgeProtection.accessory)}</td></tr>`);
      }
    }

    specGroups += `
      <div class="spec-group">
        <div class="spec-group-title">Edge Protection</div>
        <table class="spec-table">${edgeRows.join('')}</table>
      </div>`;
  }

  // Flooring
  const flooringRows = [];
  room.flooring.forEach((f, i) => {
    if (!f.material) return;
    const label = 'Flooring' + (f.materialType ? ` (${f.materialType})` : '') + (room.flooring.length > 1 ? ` ${i + 1}` : '');
    flooringRows.push(`<tr><td>${escT(label)}</td><td>${formatMaterialCell(f)}${f.installNotes ? `<span class="spec-notes">${escT(f.installNotes)}</span>` : ''}</td></tr>`);
  });

  if (flooringRows.length > 0) {
    specGroups += `
      <div class="spec-group">
        <div class="spec-group-title">Flooring</div>
        <table class="spec-table">${flooringRows.join('')}</table>
      </div>`;
  }

  // Paint & Hardware
  const finishRows = [];
  if (room.paint && room.paint.material) {
    finishRows.push(`<tr><td>Paint</td><td>${formatMaterialCell(room.paint)}${room.paint.installNotes ? `<span class="spec-notes">${escT(room.paint.installNotes)}</span>` : ''}</td></tr>`);
  }
  if (room.hardware && room.hardware.material) {
    finishRows.push(`<tr><td>Hardware</td><td>${formatMaterialCell(room.hardware)}${room.hardware.installNotes ? `<span class="spec-notes">${escT(room.hardware.installNotes)}</span>` : ''}</td></tr>`);
  }

  if (finishRows.length > 0) {
    specGroups += `
      <div class="spec-group">
        <div class="spec-group-title">Finishes</div>
        <table class="spec-table">${finishRows.join('')}</table>
      </div>`;
  }

  if (!specGroups) return '';

  return `
  <div class="page">
    <span class="page-subheading">${escT(room.label)}<span class="room-type-badge">Bathroom</span></span>
    <h2>Specification Sheet</h2>
    <div class="divider"></div>
    ${specGroups}
  </div>`;
}

// ============================================================
// FORMAT HELPERS
// ============================================================
function formatMaterialCell(state) {
  const mat = state.material;
  if (!mat) return '';
  let text = escT(mat.name);
  if (mat.vendor) {
    text += `<br><span style="font-size: 0.78rem; color: var(--sand);">${escT(mat.vendor)}${mat.series ? ' &middot; ' + escT(mat.series) : ''}${mat.color ? ' &middot; ' + escT(mat.color) : ''}</span>`;
  }
  return text;
}

// ============================================================
// SUMMARY PAGE
// ============================================================
function buildSummaryPage(rooms, report) {
  let roomSummaries = '';

  rooms.forEach(room => {
    let items = [];

    if (room.type === 'kitchen') {
      room.flooring.forEach(f => {
        if (f.material) items.push({ label: 'Flooring' + (f.materialType ? ` (${f.materialType})` : ''), name: f.material.name, notes: f.installNotes });
      });
      ['cabinetry', 'countertops', 'backsplash', 'hardware', 'paint'].forEach(cat => {
        if (room[cat] && room[cat].material) {
          items.push({ label: capitalize(cat), name: room[cat].material.name, notes: room[cat].installNotes });
        }
      });
    } else {
      // Bathroom
      room.waterFixtures.forEach((f, i) => {
        if (f.type) items.push({ label: `Fixture ${i + 1}`, name: f.type, notes: '' });
      });
      room.flooring.forEach(f => {
        if (f.material) items.push({ label: 'Flooring' + (f.materialType ? ` (${f.materialType})` : ''), name: f.material.name, notes: f.installNotes });
      });
      if (room.paint && room.paint.material) items.push({ label: 'Paint', name: room.paint.material.name, notes: room.paint.installNotes });
      if (room.hardware && room.hardware.material) items.push({ label: 'Hardware', name: room.hardware.material.name, notes: room.hardware.installNotes });
    }

    if (items.length === 0) return;

    roomSummaries += `
      <div class="room-summary-label">${escT(room.label)}</div>
      <ul class="summary-list">
        ${items.map(item => `
          <li>
            <span>${escT(item.label)}</span>
            <span>${escT(item.name)}${item.notes ? `<br><span class="summary-notes">${escT(item.notes)}</span>` : ''}</span>
          </li>
        `).join('')}
      </ul>`;
  });

  if (!roomSummaries) return '';

  return `
  <div class="page">
    <span class="page-subheading">Project Summary</span>
    <h2>Selection Overview</h2>
    <div class="divider"></div>

    <div class="summary-section">
      <h3>Selected Materials</h3>
      ${roomSummaries}
    </div>

    ${report ? `
    <div class="compat-badge" style="background: ${report.status === 'good' ? '#E8F5E9' : report.status === 'warning' ? '#FFF3E0' : '#FCE4EC'};">
      <span class="compat-dot" style="background: ${getStatusColor(report.status)};"></span>
      Tone Harmony: ${report.overallScore}% &middot; ${getStatusLabel(report.status)}
    </div>` : ''}

    <div class="next-steps">
      <h3>Next Steps</h3>
      <ol>
        <li>Review selections and provide feedback on any changes needed.</li>
        <li>Confirm material availability and pricing with vendors.</li>
        <li>Schedule installation timeline and coordinate with contractors.</li>
        <li>Final walkthrough and approval before ordering begins.</li>
      </ol>
    </div>

    <div class="presentation-footer">
      Hill Country Home Concepts &middot; Warm by Design &middot; hillcountryhomeconcepts.com
    </div>
  </div>`;
}

// ============================================================
// CONCEPT TEXT
// ============================================================
function generateConceptText(rooms) {
  // Collect all materials with tones
  const allMats = [];
  rooms.forEach(room => {
    if (room.type === 'kitchen') {
      room.flooring.forEach(f => { if (f.material) allMats.push(f.material); });
      ['cabinetry', 'countertops', 'backsplash', 'hardware', 'paint'].forEach(cat => {
        if (room[cat] && room[cat].material) allMats.push(room[cat].material);
      });
    } else {
      room.flooring.forEach(f => { if (f.material) allMats.push(f.material); });
      if (room.paint && room.paint.material) allMats.push(room.paint.material);
      if (room.hardware && room.hardware.material) allMats.push(room.hardware.material);
    }
  });

  if (allMats.length === 0) return 'Material selections will define the design direction for this space.';

  const tones = allMats.map(m => m.tone).filter(Boolean);
  const dominantTone = tones.length > 0 ? mode(tones) : 'neutral';

  const toneDescriptions = {
    warm: 'rich, warm tones that create an inviting atmosphere',
    cool: 'clean, cool tones that bring a sense of calm sophistication',
    neutral: 'a balanced neutral palette that offers timeless versatility'
  };

  const toneDesc = toneDescriptions[dominantTone] || 'a thoughtfully curated palette';

  const highlights = [];
  rooms.forEach(room => {
    if (room.type === 'kitchen') {
      if (room.flooring[0] && room.flooring[0].material) highlights.push(room.flooring[0].material.name.toLowerCase() + ' underfoot');
      if (room.cabinetry && room.cabinetry.material) highlights.push(room.cabinetry.material.name.toLowerCase() + ' cabinetry');
      if (room.countertops && room.countertops.material) highlights.push(room.countertops.material.name.toLowerCase() + ' countertops');
    }
  });

  const highlightText = highlights.length > 0
    ? ' The palette features ' + highlights.join(', ') + '.'
    : '';

  const roomCount = rooms.length;
  const roomPhrase = roomCount > 1 ? ` across ${roomCount} spaces` : '';

  return `This design brings together ${toneDesc}${roomPhrase}, creating a cohesive material story.${highlightText} Every material has been chosen to work in harmony, creating spaces that feel intentional and refined.`;
}

// ============================================================
// UTILITIES
// ============================================================
function mode(arr) {
  const freq = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.keys(freq).reduce((a, b) => freq[a] >= freq[b] ? a : b);
}

// capitalize() is defined in design-rules.js (loaded before this file)

function escT(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
