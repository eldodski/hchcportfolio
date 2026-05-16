/* ============================================================
   HCHC PDF Sign-Off Output Generator
   Produces the installation sign-off PDF per Prompt 2 spec:
   - Page 1: Cover with mood board hero
   - Pages 2+: One page per installation item
   ============================================================ */

const PDFSignoff = (function () {
  'use strict';

  // ---- Generate the full HTML for the sign-off PDF ----
  function generateSignoffHTML(data) {
    const {
      buyerRecord,        // { builder, community, lot, streetAddress, buyer1Name, buyer2Name, changeOrderDate }
      installationItems,  // [{ label, productName, productImage, diagramFile, diagramRotation, rooms }]
      moodBoardImage,     // base64 or URL
    } = data;

    const date = buyerRecord.changeOrderDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const coverHTML = buildCoverPage(buyerRecord, moodBoardImage, date);
    const installPages = installationItems.map(item => buildInstallPage(item, buyerRecord, date)).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escT(buyerRecord.builder || '')} - ${escT(buyerRecord.community || '')} Lot ${escT(buyerRecord.lot || '')} | HCHC</title>
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
    font-size: 10pt;
    line-height: 1.5;
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

  /* ======= COVER PAGE ======= */
  .page { page-break-after: always; min-height: 100vh; position: relative; }

  .cover {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--ivory);
  }

  .cover-hero {
    flex: 1;
    background-size: cover;
    background-position: center;
    min-height: 60vh;
  }

  .cover-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .cover-info {
    padding: 40px 60px;
    background: var(--ivory);
  }

  .cover-title {
    font-size: 1.6rem;
    margin-bottom: 16px;
  }

  .cover-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    font-size: 0.85rem;
  }

  .cover-field label {
    font-size: 0.65rem;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mocha);
    display: block;
    margin-bottom: 2px;
  }

  .cover-field span {
    color: var(--navy);
    font-weight: 400;
  }

  /* ======= WATERMARK ======= */
  .watermark {
    position: absolute;
    bottom: 20px;
    right: 30px;
    font-family: 'Jost', sans-serif;
    font-weight: 200;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(27, 42, 74, 0.08);
  }

  /* ======= INSTALL PAGE ======= */
  .install-page {
    padding: 30px 40px 60px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: relative;
  }

  .install-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--sand);
    margin-bottom: 20px;
  }

  .install-header-left h2 {
    font-size: 1.4rem;
    margin-bottom: 4px;
  }

  .install-header-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    font-size: 0.7rem;
    color: var(--mocha);
  }

  .install-header-fields span {
    white-space: nowrap;
  }

  .install-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    flex: 1;
    align-items: start;
  }

  /* Product image — left half */
  .install-product {
    width: 100%;
  }

  .install-product-img {
    width: 100%;
    aspect-ratio: 4/3;
    overflow: hidden;
    background: var(--carrara);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .install-product-img img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .install-product-name {
    margin-top: 8px;
    font-size: 0.85rem;
    font-weight: 400;
    color: var(--navy);
  }

  .install-product-rooms {
    font-size: 0.75rem;
    color: var(--mocha);
    margin-top: 4px;
  }

  /* Diagram — right half */
  .install-diagram {
    width: 100%;
  }

  .install-diagram-img {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: #fff;
    border: 1px solid var(--carrara);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .install-diagram-img img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .install-disclaimer {
    margin-top: 6px;
    font-size: 0.6rem;
    font-style: italic;
    color: var(--sand);
  }

  /* Signature line */
  .install-signature {
    margin-top: auto;
    padding-top: 24px;
    display: flex;
    gap: 40px;
    align-items: flex-end;
  }

  .install-sig-line {
    flex: 1;
    border-bottom: 1px solid var(--espresso);
    padding-bottom: 4px;
  }

  .install-sig-label {
    font-size: 0.7rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mocha);
    margin-top: 4px;
  }

  .install-sig-date {
    width: 180px;
    border-bottom: 1px solid var(--espresso);
    padding-bottom: 4px;
  }
</style>
</head>
<body>
${coverHTML}
${installPages}
</body>
</html>`;
  }

  // ---- Cover Page ----
  function buildCoverPage(buyer, moodBoardImage, date) {
    const heroImg = moodBoardImage
      ? `<img src="${moodBoardImage}" alt="Design mood board">`
      : `<div style="height:100%; background:var(--carrara); display:flex; align-items:center; justify-content:center; color:var(--sand); font-size:1.2rem;">Mood Board Image</div>`;

    return `
    <div class="page cover">
      <div class="cover-hero">${heroImg}</div>
      <div class="cover-info">
        <h1 class="cover-title">${escT(buyer.buyer1Name || '')}${buyer.buyer2Name ? ' &amp; ' + escT(buyer.buyer2Name) : ''} Finish Selections</h1>
        <div class="cover-fields">
          <div class="cover-field"><label>Builder</label><span>${escT(buyer.builder || '')}</span></div>
          <div class="cover-field"><label>Community</label><span>${escT(buyer.community || '')}</span></div>
          <div class="cover-field"><label>Lot</label><span>${escT(buyer.lot || '')}</span></div>
          <div class="cover-field"><label>Street Address</label><span>${escT(buyer.streetAddress || '')}</span></div>
          <div class="cover-field"><label>Buyer 1</label><span>${escT(buyer.buyer1Name || '')}</span></div>
          ${buyer.buyer2Name ? `<div class="cover-field"><label>Buyer 2</label><span>${escT(buyer.buyer2Name)}</span></div>` : ''}
          <div class="cover-field"><label>Change Order Date</label><span>${escT(date)}</span></div>
        </div>
      </div>
      <div class="watermark">Hill Country Home Concepts</div>
    </div>`;
  }

  // ---- Installation Sign-Off Page ----
  function buildInstallPage(item, buyer, date) {
    const productImg = item.productImage
      ? `<img src="${item.productImage}" alt="${escT(item.productName)}">`
      : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--sand); font-size:0.9rem;">No image available</div>`;

    let diagramImg = '';
    if (item.diagramFile) {
      const rotation = item.diagramRotation || 0;
      const rotateStyle = rotation ? `transform: rotate(${rotation}deg);` : '';
      diagramImg = `<img src="/images/diagrams/${encodeURIComponent(item.diagramFile)}" alt="Installation diagram" style="${rotateStyle}">`;
    } else {
      diagramImg = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--sand); font-size:0.9rem;">No diagram selected</div>`;
    }

    const roomsList = item.rooms && item.rooms.length > 0
      ? `<div class="install-product-rooms">Rooms: ${item.rooms.map(r => escT(r)).join(', ')}</div>`
      : '';

    return `
    <div class="page install-page">
      <div class="install-header">
        <div class="install-header-left">
          <h2>${escT(item.label)}</h2>
        </div>
        <div class="install-header-fields">
          <span>${escT(buyer.builder || '')}</span>
          <span>${escT(buyer.community || '')}</span>
          <span>Lot ${escT(buyer.lot || '')}</span>
          <span>${escT(buyer.streetAddress || '')}</span>
          <span>${escT(buyer.buyer1Name || '')}${buyer.buyer2Name ? ' &amp; ' + escT(buyer.buyer2Name) : ''}</span>
          <span>${escT(date)}</span>
        </div>
      </div>

      <div class="install-content">
        <div class="install-product">
          <div class="install-product-img">${productImg}</div>
          <div class="install-product-name">${escT(item.productName)}</div>
          ${roomsList}
        </div>
        <div class="install-diagram">
          <div class="install-diagram-img">${diagramImg}</div>
          <div class="install-disclaimer">Diagrams vary and may not be to scale.</div>
        </div>
      </div>

      <div class="install-signature">
        <div>
          <div class="install-sig-line"></div>
          <div class="install-sig-label">Buyer Initials</div>
        </div>
        <div>
          <div class="install-sig-date"></div>
          <div class="install-sig-label">Date</div>
        </div>
      </div>

      <div class="watermark">Hill Country Home Concepts</div>
    </div>`;
  }

  // ---- Collect installation items from presentation data ----
  // Groups selections per the spec: one page per tile product, one page per flooring product
  function collectInstallItems(rooms, diagramSelections) {
    const items = [];
    const flooringProducts = {}; // group by product name
    const tileProducts = {};     // group by product name

    rooms.forEach(room => {
      if (!room.selections) return;

      Object.entries(room.selections).forEach(([category, sel]) => {
        if (!sel || !sel.materialId) return;

        const material = sel.material || {};
        const isFlooring = ['flooring', 'lvp', 'hardwood'].some(t =>
          category.toLowerCase().includes(t) || (material.category || '').toLowerCase().includes(t)
        );

        const productKey = material.name || sel.productName || 'Unknown Product';

        if (isFlooring) {
          if (!flooringProducts[productKey]) {
            flooringProducts[productKey] = {
              label: 'Main Floor ' + (material.category || 'LVP'),
              productName: productKey,
              productImage: material.image_url || sel.imageUrl || null,
              rooms: [],
              installNotes: sel.installNotes || '',
              category: category,
            };
          }
          flooringProducts[productKey].rooms.push(room.name || room.label || 'Room');
        } else if (['kitchen_backsplash', 'bathroom_wall', 'tile_floor', 'mudset'].includes(category)) {
          if (!tileProducts[productKey]) {
            tileProducts[productKey] = {
              label: _labelForTile(category, room),
              productName: productKey,
              productImage: material.image_url || sel.imageUrl || null,
              rooms: [],
              installNotes: sel.installNotes || '',
              category: category,
            };
          }
          tileProducts[productKey].rooms.push(room.name || room.label || 'Room');
        }
      });
    });

    // Convert to items array, attach diagrams
    Object.values(tileProducts).forEach(prod => {
      const diagram = diagramSelections?.[prod.productName] || {};
      items.push({
        label: prod.label,
        productName: prod.productName,
        productImage: prod.productImage,
        diagramFile: diagram.file || null,
        diagramRotation: diagram.rotation || 0,
        rooms: prod.rooms,
      });
    });

    Object.values(flooringProducts).forEach(prod => {
      const diagram = diagramSelections?.[prod.productName] || {};
      items.push({
        label: prod.label,
        productName: prod.productName,
        productImage: prod.productImage,
        diagramFile: diagram.file || null,
        diagramRotation: diagram.rotation || 0,
        rooms: prod.rooms,
      });
    });

    return items;
  }

  function _labelForTile(category, room) {
    const roomName = room.name || room.label || '';
    switch (category) {
      case 'kitchen_backsplash': return 'Kitchen Backsplash';
      case 'bathroom_wall': return roomName + ' Shower Surround';
      case 'tile_floor': return roomName + ' Floor Tile';
      case 'mudset': return roomName + ' Mudset';
      default: return roomName + ' Tile';
    }
  }

  // ---- Download as PDF ----
  async function downloadSignoffPDF(data) {
    const html = generateSignoffHTML(data);

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const buyer = data.buyerRecord || {};
    const filename = `${(buyer.builder || 'HCHC').replace(/[^a-zA-Z0-9]/g, '_')}_${(buyer.community || '').replace(/[^a-zA-Z0-9]/g, '_')}_Lot${(buyer.lot || '').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    try {
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.page' }
      };

      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      return true;
    } catch (err) {
      console.error('PDF generation failed:', err);
      document.body.removeChild(container);
      return false;
    }
  }

  function escT(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    generateSignoffHTML,
    collectInstallItems,
    downloadSignoffPDF,
  };
})();
