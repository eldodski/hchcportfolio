/**
 * Contract Parser Module — HCHC Presentation Engine
 * Path B: Document upload -> Gemini AI extraction -> Designer confirmation -> Field population
 *
 * Self-contained module. Injects its own CSS and DOM elements.
 * Uses the existing /api/gemini serverless proxy for AI extraction.
 */

const ContractParser = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────
  let _lastParsedData = null;
  let _isVisible = false;
  let _containerEl = null;

  // ── Extraction Prompt ──────────────────────────────────────────────
  const EXTRACTION_PROMPT = `You are a document parser for an interior design presentation tool. Extract ONLY the buyer record and interior design finish selections from this change order document.

BUYER RECORD — extract these 7 fields exactly as written. Use "not found" if absent:
- Builder, Community/Subdivision, Lot, Street Address, Buyer 1 Full Name, Buyer 2 Full Name, Change Order Date

FINISH SELECTIONS — extract ONLY these interior design categories:
- Flooring (LVP, hardwood, tile floor)
- Countertops (quartz, granite, marble)
- Backsplash (kitchen tile)
- Cabinetry (cabinet style, wood, finish)
- Wall Tile (bathroom walls, shower tile)
- Floor Tile (bathroom floor tile)
- Paint (wall colors, trim colors)
- Hardware (cabinet knobs, pulls)

SKIP everything else (plumbing fixtures, doors, windows, HVAC, electrical, appliances, structural items, pricing).

For each finish selection include: the room or area it applies to (e.g. "Kitchen", "Master Bath", "All Bathrooms"), the vendor and product name, the color/finish, and any installation notes (pattern, grout color, direction, etc).

Return as JSON:
{
  "buyerRecord": {
    "builder": "",
    "community": "",
    "lot": "",
    "streetAddress": "",
    "buyer1Name": "",
    "buyer2Name": "",
    "changeOrderDate": ""
  },
  "finishSelections": [
    {
      "room": "Kitchen",
      "category": "backsplash",
      "productName": "DalTile Perpetuo 12x24",
      "color": "Elegant Beige",
      "installNotes": "herringbone pattern, Frost grout"
    }
  ]
}

Use these exact category values: flooring, countertops, backsplash, cabinetry, wall_tile, floor_tile, paint, hardware.`;

  // ── Accepted MIME types ────────────────────────────────────────────
  const ACCEPTED_TYPES = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/tiff': '.tiff'
  };

  const ACCEPT_STRING = Object.values(ACCEPTED_TYPES).join(',') + ',' + Object.keys(ACCEPTED_TYPES).join(',');

  // ── CSS Injection ──────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('contract-parser-styles')) return;
    const style = document.createElement('style');
    style.id = 'contract-parser-styles';
    style.textContent = `
      /* ── Upload Area ── */
      .cp-container {
        margin-bottom: 24px;
        border-bottom: 1px solid var(--sand);
        padding-bottom: 20px;
      }

      .cp-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .cp-header h3 {
        font-family: var(--heading);
        font-weight: 600;
        font-size: 1.05rem;
        color: var(--navy);
        margin: 0;
      }

      .cp-toggle-btn {
        font-family: var(--body);
        font-size: 0.68rem;
        font-weight: 300;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--dusty-blue);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 0;
        transition: color 0.2s;
      }

      .cp-toggle-btn:hover {
        color: var(--navy);
      }

      .cp-body {
        display: none;
      }

      .cp-body.cp-visible {
        display: block;
      }

      .cp-dropzone {
        border: 2px dashed var(--sand);
        padding: 32px 20px;
        text-align: center;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
        background: var(--ivory);
      }

      .cp-dropzone:hover,
      .cp-dropzone.cp-dragover {
        border-color: var(--gold);
        background: #faf7f2;
      }

      .cp-dropzone-icon {
        font-size: 1.8rem;
        color: var(--sand);
        margin-bottom: 8px;
        line-height: 1;
      }

      .cp-dropzone-text {
        font-family: var(--body);
        font-size: 0.82rem;
        font-weight: 300;
        color: var(--espresso);
      }

      .cp-dropzone-text strong {
        font-weight: 400;
        color: var(--navy);
      }

      .cp-dropzone-hint {
        font-size: 0.68rem;
        color: var(--mocha);
        margin-top: 6px;
        font-weight: 300;
      }

      .cp-file-input {
        display: none;
      }

      /* ── Processing State ── */
      .cp-status {
        display: none;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        background: var(--ivory);
        margin-top: 12px;
        font-size: 0.82rem;
        font-weight: 300;
        color: var(--espresso);
      }

      .cp-status.cp-active {
        display: flex;
      }

      .cp-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--sand);
        border-top-color: var(--navy);
        border-radius: 50%;
        animation: cp-spin 0.7s linear infinite;
        flex-shrink: 0;
      }

      @keyframes cp-spin {
        to { transform: rotate(360deg); }
      }

      .cp-error {
        display: none;
        padding: 12px 16px;
        background: #fdf2f2;
        border: 1px solid #e8b4b4;
        color: #7a2828;
        font-size: 0.82rem;
        font-weight: 300;
        margin-top: 12px;
      }

      .cp-error.cp-active {
        display: block;
      }

      /* ── Confirmation Panel ── */
      .cp-confirm-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(27, 42, 74, 0.45);
        z-index: 9000;
        align-items: center;
        justify-content: center;
      }

      .cp-confirm-overlay.cp-active {
        display: flex;
      }

      .cp-confirm-panel {
        background: #fff;
        width: 90vw;
        max-width: 860px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 32px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
      }

      .cp-confirm-title {
        font-family: var(--heading);
        font-weight: 600;
        font-size: 1.3rem;
        color: var(--navy);
        margin-bottom: 4px;
      }

      .cp-confirm-subtitle {
        font-size: 0.78rem;
        font-weight: 300;
        color: var(--mocha);
        margin-bottom: 24px;
      }

      .cp-confirm-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
        margin-bottom: 24px;
      }

      @media (max-width: 700px) {
        .cp-confirm-grid {
          grid-template-columns: 1fr;
        }
      }

      .cp-confirm-section-label {
        font-size: 0.68rem;
        font-weight: 300;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--mocha);
        margin-bottom: 12px;
        border-bottom: 1px solid var(--carrara);
        padding-bottom: 6px;
      }

      .cp-field {
        margin-bottom: 10px;
      }

      .cp-field label {
        display: block;
        font-size: 0.68rem;
        font-weight: 300;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mocha);
        margin-bottom: 3px;
      }

      .cp-field input {
        width: 100%;
        font-family: var(--body);
        font-weight: 300;
        font-size: 0.85rem;
        padding: 8px 10px;
        border: 1px solid var(--sand);
        background: #fff;
        color: var(--espresso);
        outline: none;
        transition: border-color 0.2s;
      }

      .cp-field input:focus {
        border-color: var(--navy);
      }

      .cp-field input.cp-not-found {
        color: var(--mocha);
        font-style: italic;
      }

      /* ── Finish Selections Table ── */
      .cp-finishes-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .cp-finish-row {
        background: var(--ivory);
        padding: 10px 12px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .cp-finish-row .cp-field {
        margin-bottom: 0;
      }

      .cp-finish-row .cp-field:first-child {
        grid-column: 1 / -1;
      }

      .cp-no-finishes {
        font-size: 0.82rem;
        font-weight: 300;
        color: var(--mocha);
        font-style: italic;
        padding: 12px 0;
      }

      /* ── Buttons ── */
      .cp-confirm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid var(--carrara);
        padding-top: 20px;
      }

      .cp-btn {
        font-family: var(--body);
        font-size: 0.78rem;
        font-weight: 300;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 10px 24px;
        border: none;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      }

      .cp-btn-cancel {
        background: var(--carrara);
        color: var(--espresso);
      }

      .cp-btn-cancel:hover {
        background: var(--sand);
      }

      .cp-btn-confirm {
        background: var(--navy);
        color: var(--ivory);
      }

      .cp-btn-confirm:hover {
        background: var(--espresso);
      }
    `;
    document.head.appendChild(style);
  }

  // ── DOM Creation ───────────────────────────────────────────────────

  function createUploadUI() {
    const container = document.createElement('div');
    container.className = 'cp-container';
    container.innerHTML = `
      <div class="cp-header">
        <h3>Contract Parser</h3>
        <button class="cp-toggle-btn" type="button">Upload Document</button>
      </div>
      <div class="cp-body">
        <div class="cp-dropzone">
          <div class="cp-dropzone-icon">\u2B06</div>
          <div class="cp-dropzone-text">
            <strong>Drop a change order here</strong> or click to browse
          </div>
          <div class="cp-dropzone-hint">PDF, Excel, Word, or scanned image</div>
        </div>
        <input type="file" class="cp-file-input" accept="${ACCEPT_STRING}">
        <div class="cp-status">
          <div class="cp-spinner"></div>
          <span class="cp-status-text">Extracting data from document...</span>
        </div>
        <div class="cp-error"></div>
      </div>
    `;
    return container;
  }

  function createConfirmationOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'cp-confirm-overlay';
    overlay.innerHTML = `
      <div class="cp-confirm-panel">
        <div class="cp-confirm-title">Confirm Extracted Data</div>
        <div class="cp-confirm-subtitle">Review and edit the fields below before populating the presentation.</div>
        <div class="cp-confirm-grid">
          <div class="cp-col-buyer">
            <div class="cp-confirm-section-label">Buyer Record</div>
            <div class="cp-buyer-fields"></div>
          </div>
          <div class="cp-col-finishes">
            <div class="cp-confirm-section-label">Finish Selections</div>
            <div class="cp-finishes-list"></div>
          </div>
        </div>
        <div class="cp-confirm-actions">
          <button class="cp-btn cp-btn-cancel" type="button">Cancel</button>
          <button class="cp-btn cp-btn-confirm" type="button">Confirm &amp; Populate</button>
        </div>
      </div>
    `;
    return overlay;
  }

  // ── Buyer Field Definitions ────────────────────────────────────────

  const BUYER_FIELDS = [
    { key: 'builder', label: 'Builder' },
    { key: 'community', label: 'Community' },
    { key: 'lot', label: 'Lot' },
    { key: 'streetAddress', label: 'Street Address' },
    { key: 'buyer1Name', label: 'Buyer 1 Name' },
    { key: 'buyer2Name', label: 'Buyer 2 Name' },
    { key: 'changeOrderDate', label: 'Change Order Date' }
  ];

  // ── Render Confirmation Panel ──────────────────────────────────────

  function renderBuyerFields(overlay, buyerRecord) {
    const container = overlay.querySelector('.cp-buyer-fields');
    container.innerHTML = '';
    BUYER_FIELDS.forEach(function (def) {
      const val = buyerRecord[def.key] || '';
      const isNotFound = val.toLowerCase() === 'not found';
      const div = document.createElement('div');
      div.className = 'cp-field';
      div.innerHTML = `
        <label>${def.label}</label>
        <input type="text" data-buyer-key="${def.key}" value="${escapeAttr(isNotFound ? '' : val)}" placeholder="${isNotFound ? 'Not found in document' : ''}" class="${isNotFound ? 'cp-not-found' : ''}">
      `;
      // Remove italic styling when user starts typing
      const input = div.querySelector('input');
      input.addEventListener('input', function () {
        this.classList.remove('cp-not-found');
      });
      container.appendChild(div);
    });
  }

  function renderFinishSelections(overlay, finishSelections) {
    const container = overlay.querySelector('.cp-finishes-list');
    container.innerHTML = '';
    if (!finishSelections || finishSelections.length === 0) {
      container.innerHTML = '<div class="cp-no-finishes">No finish selections found in document.</div>';
      return;
    }
    finishSelections.forEach(function (item, idx) {
      const row = document.createElement('div');
      row.className = 'cp-finish-row';
      row.innerHTML = `
        <div class="cp-field">
          <label>Room</label>
          <input type="text" data-finish-idx="${idx}" data-finish-key="room" value="${escapeAttr(item.room || '')}">
        </div>
        <div class="cp-field">
          <label>Category</label>
          <input type="text" data-finish-idx="${idx}" data-finish-key="category" value="${escapeAttr(item.category || '')}">
        </div>
        <div class="cp-field">
          <label>Product Name</label>
          <input type="text" data-finish-idx="${idx}" data-finish-key="productName" value="${escapeAttr(item.productName || '')}">
        </div>
        <div class="cp-field">
          <label>Color</label>
          <input type="text" data-finish-idx="${idx}" data-finish-key="color" value="${escapeAttr(item.color || '')}">
        </div>
        <div class="cp-field">
          <label>Install Notes</label>
          <input type="text" data-finish-idx="${idx}" data-finish-key="installNotes" value="${escapeAttr(item.installNotes || '')}">
        </div>
      `;
      container.appendChild(row);
    });
  }

  // ── File Handling ──────────────────────────────────────────────────

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        // result is "data:<mime>;base64,<data>" — strip the prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = function () {
        reject(new Error('Failed to read file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  function isAcceptedFile(file) {
    if (ACCEPTED_TYPES[file.type]) return true;
    // Fallback: check extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return Object.values(ACCEPTED_TYPES).includes(ext);
  }

  function getMimeType(file) {
    if (file.type && ACCEPTED_TYPES[file.type]) return file.type;
    // Infer from extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    for (var mime in ACCEPTED_TYPES) {
      if (ACCEPTED_TYPES[mime] === ext) return mime;
    }
    return 'application/octet-stream';
  }

  // ── Helper: parse error from response ─────────────────────────────

  function parseApiError(errBody, status) {
    if (!errBody) return 'API returned status ' + status;
    if (typeof errBody.error === 'object') return errBody.error.message || JSON.stringify(errBody.error);
    return errBody.error || ('API returned status ' + status);
  }

  // ── API Call (two-step: upload to Gemini, then generate) ──────────

  async function extractFromDocument(file) {
    var mimeType = getMimeType(file);

    // Step 1: Get a Gemini upload URL from our lightweight API (tiny JSON body, no file data)
    var uploadUrlRes;
    try {
      uploadUrlRes = await fetch('/api/gemini-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: mimeType, fileName: file.name, fileSize: file.size })
      });
    } catch (networkErr) {
      throw new Error('Network error: Could not reach the server. ' + (networkErr.message || ''));
    }
    if (!uploadUrlRes.ok) {
      var e1; try { e1 = await uploadUrlRes.json(); } catch (_) { e1 = {}; }
      throw new Error(parseApiError(e1, uploadUrlRes.status));
    }
    var uploadData = await uploadUrlRes.json();
    var uploadUrl = uploadData.uploadUrl;
    if (!uploadUrl) throw new Error('Server did not return an upload URL.');

    // Step 2: Upload file directly to Gemini (bypasses Vercel body limit entirely)
    var fileBuffer = await file.arrayBuffer();
    var uploadRes;
    try {
      uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Length': String(file.size),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: fileBuffer
      });
    } catch (networkErr) {
      throw new Error('File upload to Gemini failed: ' + (networkErr.message || ''));
    }
    if (!uploadRes.ok) {
      throw new Error('File upload failed with status ' + uploadRes.status);
    }
    var fileData = await uploadRes.json();
    var fileUri = fileData.file && fileData.file.uri;
    var fileName2 = fileData.file && fileData.file.name;
    if (!fileUri) throw new Error('Upload succeeded but no file URI returned.');

    // Step 3: Poll until file is ACTIVE (Gemini needs time to process PDFs)
    var state = (fileData.file && fileData.file.state) || 'PROCESSING';
    var attempts = 0;
    while (state === 'PROCESSING' && attempts < 30) {
      await new Promise(function (r) { setTimeout(r, 2000); });
      try {
        // Poll via our upload endpoint to avoid exposing the API key
        // Actually, the status URL is public once you have the file name
        var statusRes = await fetch('/api/gemini-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkStatus: fileName2 })
        });
        if (statusRes.ok) {
          var sd = await statusRes.json();
          state = sd.state || state;
        }
      } catch (_) { /* keep polling */ }
      attempts++;
    }
    if (state !== 'ACTIVE') {
      throw new Error('File processing timed out (state: ' + state + '). Try a smaller document.');
    }

    // Step 4: Call generateContent via our API (small JSON body, no file data)
    var response;
    try {
      response = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUri: fileUri,
          mimeType: mimeType,
          prompt: EXTRACTION_PROMPT,
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json'
          }
        })
      });
    } catch (networkErr) {
      throw new Error('Network error calling Gemini: ' + (networkErr.message || ''));
    }

    if (!response.ok) {
      var errBody;
      try { errBody = await response.json(); } catch (_) { errBody = {}; }
      throw new Error(parseApiError(errBody, response.status));
    }

    var data;
    try { data = await response.json(); } catch (_) {
      throw new Error('Invalid response from server.');
    }

    // Extract text from Gemini response
    var text = '';
    try {
      text = data.candidates[0].content.parts[0].text;
    } catch (e) {
      if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
        throw new Error('Document was blocked by content safety filters. Try a different file.');
      }
      throw new Error('Unexpected response format from Gemini.');
    }

    // Strip markdown fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new Error('Gemini did not return valid JSON. Raw response: ' + text.substring(0, 200));
    }

    // Ensure expected structure
    if (!parsed.buyerRecord) parsed.buyerRecord = {};
    if (!parsed.finishSelections) parsed.finishSelections = [];

    return parsed;
  }

  // ── Populate Presentation Engine Fields ────────────────────────────

  // Map parser category names to Supabase material DB category names
  var CATEGORY_MAP = {
    'backsplash': 'kitchen_backsplash',
    'countertops': 'countertops',
    'cabinetry': 'cabinetry',
    'paint': 'paint',
    'hardware': 'hardware',
    'wall_tile': 'bathroom_wall',
    'floor_tile': 'tile_floor'
  };

  // Categories that go onto kitchen rooms via the cascade card system
  var KITCHEN_CATS = ['backsplash', 'countertops', 'cabinetry', 'paint', 'hardware'];

  // Categories that go onto bathroom fixtures or bathroom-level properties
  var BATH_FIXTURE_CATS = ['wall_tile', 'floor_tile'];

  function isKitchenRoom(roomName) {
    var lower = (roomName || '').toLowerCase();
    return lower.includes('kitchen') || lower.includes('pantry') || lower.includes('laundry') || lower.includes('utility');
  }

  function isBathroomRoom(roomName) {
    var lower = (roomName || '').toLowerCase();
    return lower.includes('bath') || lower.includes('shower') || lower.includes('powder') || lower.includes('restroom') || lower.includes('master') || lower.includes('owner');
  }

  /**
   * Fuzzy-match a parsed product string against allMaterials.
   * Tries exact vendor+series match first, then progressively looser text matching.
   * Returns the best matching material or null.
   */
  function fuzzyMatchMaterial(category, productName, color) {
    if (typeof allMaterials === 'undefined' || !allMaterials.length) return null;

    var engineCat = CATEGORY_MAP[category] || category;
    var candidates = allMaterials.filter(function (m) { return m.category === engineCat; });
    if (!candidates.length) {
      // Also try flooring category for floor-related items
      if (category === 'flooring' || category === 'floor_tile') {
        candidates = allMaterials.filter(function (m) {
          return m.category === 'flooring' || m.category === 'tile_floor';
        });
      }
    }
    if (!candidates.length) return null;

    var pLower = (productName || '').toLowerCase();
    var cLower = (color || '').toLowerCase();

    // Score each candidate
    var scored = candidates.map(function (m) {
      var score = 0;
      var mVendor = (m.vendor || '').toLowerCase();
      var mSeries = (m.series || '').toLowerCase();
      var mColor = (m.color || '').toLowerCase();
      var mName = (m.name || '').toLowerCase();

      // Vendor match in product name
      if (mVendor && pLower.includes(mVendor)) score += 30;

      // Series match in product name
      if (mSeries && pLower.includes(mSeries)) score += 30;

      // Color match — highest weight to ensure correct variant
      if (cLower && mColor) {
        if (mColor === cLower) score += 40;
        else if (cLower.includes(mColor) || mColor.includes(cLower)) score += 20;
      }

      // Full name match as fallback
      if (mName && pLower.includes(mName)) score += 20;
      if (mName && mName.includes(pLower)) score += 15;

      // Also check if color appears in product name (e.g., "Sonoma Linen")
      if (mColor && pLower.includes(mColor)) score += 15;

      return { material: m, score: score };
    });

    // Sort by score descending
    scored.sort(function (a, b) { return b.score - a.score; });

    // Only return if we have a reasonable match (at least vendor OR series matched)
    if (scored[0] && scored[0].score >= 30) {
      return scored[0].material;
    }
    return null;
  }

  /**
   * Set a material cascade state (vendor/series/color/material) on a room property.
   */
  function setCascadeState(state, mat, installNotes) {
    if (mat) {
      state.vendor = mat.vendor || '';
      state.series = mat.series || '';
      state.color = mat.color || '';
      state.material = mat;
    }
    // Filter out "not found" and similar placeholder values
    if (installNotes && installNotes.toLowerCase() !== 'not found' && installNotes.toLowerCase() !== 'n/a' && installNotes.toLowerCase() !== 'none') {
      state.installNotes = installNotes;
    }
  }

  function populateFields(data) {
    var br = data.buyerRecord;

    // ── Buyer Record Fields ──
    var projectParts = [];
    if (br.builder) projectParts.push(br.builder);
    var communityLot = '';
    if (br.community) communityLot += br.community;
    if (br.lot) communityLot += (communityLot ? ' Lot ' : 'Lot ') + br.lot;
    if (communityLot) projectParts.push(communityLot);
    var projectName = projectParts.join(' - ');

    var projectInput = document.getElementById('project-name');
    if (projectInput && projectName) {
      projectInput.value = projectName;
    }

    var clientName = br.buyer1Name || '';
    if (br.buyer2Name && br.buyer2Name.toLowerCase() !== 'not found') {
      clientName += ' & ' + br.buyer2Name;
    }
    var clientInput = document.getElementById('client-name');
    if (clientInput && clientName) {
      clientInput.value = clientName;
    }

    var builderInput = document.getElementById('builder-name');
    if (builderInput && br.builder) {
      builderInput.value = br.builder;
    }

    var addressInput = document.getElementById('address');
    if (addressInput && br.streetAddress && br.streetAddress.toLowerCase() !== 'not found') {
      addressInput.value = br.streetAddress;
    }

    // ── Finish Selections → Rooms ──
    var finishes = data.finishSelections || [];
    if (!finishes.length) {
      if (typeof updatePreview === 'function') updatePreview();
      return;
    }

    // Group selections by room name
    var roomGroups = {};
    finishes.forEach(function (sel) {
      var roomName = sel.room || 'General';
      if (!roomGroups[roomName]) roomGroups[roomName] = [];
      roomGroups[roomName].push(sel);
    });

    // Clear existing rooms
    if (typeof rooms !== 'undefined') {
      rooms.length = 0;
      if (typeof roomIdCounter !== 'undefined') roomIdCounter = 0;
    }

    var roomNames = Object.keys(roomGroups);

    // Classify rooms and create them
    // Selections tagged "All" or "General" get distributed to the first matching room
    var generalSelections = [];
    var createdRooms = [];

    roomNames.forEach(function (name) {
      var lower = name.toLowerCase();
      if (lower === 'all' || lower === 'general' || lower === 'all bathrooms' || lower === 'all rooms' || lower === 'whole house' || lower === 'throughout') {
        // These get distributed after rooms are created
        generalSelections = generalSelections.concat(roomGroups[name]);
        return;
      }

      var type = 'bathroom'; // default to bathroom
      if (isKitchenRoom(name)) type = 'kitchen';
      else if (!isBathroomRoom(name)) {
        // Ambiguous rooms (e.g., "Living Room", "Foyer") - check their categories
        var cats = roomGroups[name].map(function (s) { return s.category; });
        var hasKitchenCat = cats.some(function (c) { return KITCHEN_CATS.indexOf(c) >= 0; });
        if (hasKitchenCat) type = 'kitchen';
      }

      if (typeof createRoomState === 'function' && typeof rooms !== 'undefined') {
        var roomState = createRoomState(type);
        // Override the auto-generated label with the parsed room name
        roomState.label = name;
        rooms.push(roomState);
        createdRooms.push({ state: roomState, type: type, name: name, selections: roomGroups[name] });
      }
    });

    // If no rooms were created but we have general selections, create defaults
    if (createdRooms.length === 0 && generalSelections.length > 0) {
      var hasKitchenItems = generalSelections.some(function (s) { return KITCHEN_CATS.indexOf(s.category) >= 0; });
      var hasBathItems = generalSelections.some(function (s) { return BATH_FIXTURE_CATS.indexOf(s.category) >= 0; });

      if (hasKitchenItems && typeof createRoomState === 'function') {
        var kitchenRoom = createRoomState('kitchen');
        rooms.push(kitchenRoom);
        createdRooms.push({ state: kitchenRoom, type: 'kitchen', name: 'Kitchen', selections: [] });
      }
      if (hasBathItems && typeof createRoomState === 'function') {
        var bathRoom = createRoomState('bathroom');
        rooms.push(bathRoom);
        createdRooms.push({ state: bathRoom, type: 'bathroom', name: "Owner's Bath", selections: [] });
      }
      // If still nothing, create both defaults
      if (createdRooms.length === 0 && typeof createRoomState === 'function') {
        var defKitchen = createRoomState('kitchen');
        var defBath = createRoomState('bathroom');
        rooms.push(defKitchen);
        rooms.push(defBath);
        createdRooms.push({ state: defKitchen, type: 'kitchen', name: 'Kitchen', selections: [] });
        createdRooms.push({ state: defBath, type: 'bathroom', name: "Owner's Bath", selections: [] });
      }
    }

    // Distribute "general" selections to the first matching room type
    generalSelections.forEach(function (sel) {
      var isKitchenCat = KITCHEN_CATS.indexOf(sel.category) >= 0;
      var targetType = isKitchenCat ? 'kitchen' : 'bathroom';
      // Find first room of matching type, or first room available
      var target = createdRooms.find(function (r) { return r.type === targetType; }) || createdRooms[0];
      if (target) target.selections.push(sel);
    });

    // Apply selections to each room's state
    createdRooms.forEach(function (entry) {
      var roomState = entry.state;
      var type = entry.type;

      entry.selections.forEach(function (sel) {
        var cat = sel.category;
        var mat = fuzzyMatchMaterial(cat, sel.productName, sel.color);

        if (type === 'kitchen') {
          // Kitchen cascade categories
          var engineCat = CATEGORY_MAP[cat];
          if (engineCat && roomState[engineCat]) {
            setCascadeState(roomState[engineCat], mat, sel.installNotes);
            // Also set raw values even if no material match
            if (!mat && sel.productName) {
              // Try to split productName into vendor + series
              var parts = (sel.productName || '').split(/\s+/);
              if (parts.length >= 2) {
                roomState[engineCat].vendor = parts[0];
                roomState[engineCat].series = parts.slice(1).join(' ');
              }
              roomState[engineCat].color = sel.color || '';
            }
          } else if (cat === 'flooring') {
            // Set on first flooring slot
            var f = roomState.flooring[0];
            if (f) {
              setCascadeState(f, mat, sel.installNotes);
              if (!mat && sel.productName) {
                var fp = (sel.productName || '').split(/\s+/);
                if (fp.length >= 2) {
                  f.vendor = fp[0];
                  f.series = fp.slice(1).join(' ');
                }
                f.color = sel.color || '';
              }
            }
          }
        } else {
          // Bathroom room
          if (cat === 'wall_tile' || cat === 'floor_tile') {
            // Apply to first water fixture's surround or floor tile
            var fixture = roomState.waterFixtures && roomState.waterFixtures[0];
            if (fixture) {
              var tileState = cat === 'wall_tile' ? fixture.surroundTile : fixture.floorTile;
              setCascadeState(tileState, mat, sel.installNotes);
              if (!mat && sel.productName) {
                var tp = (sel.productName || '').split(/\s+/);
                if (tp.length >= 2) {
                  tileState.vendor = tp[0];
                  tileState.series = tp.slice(1).join(' ');
                }
                tileState.color = sel.color || '';
              }
            }
          } else if (cat === 'flooring') {
            var bf = roomState.flooring && roomState.flooring[0];
            if (bf) {
              setCascadeState(bf, mat, sel.installNotes);
              if (!mat && sel.productName) {
                var bfp = (sel.productName || '').split(/\s+/);
                if (bfp.length >= 2) {
                  bf.vendor = bfp[0];
                  bf.series = bfp.slice(1).join(' ');
                }
                bf.color = sel.color || '';
              }
            }
          } else if (cat === 'paint' && roomState.paint) {
            setCascadeState(roomState.paint, mat, sel.installNotes);
          } else if (cat === 'hardware' && roomState.hardware) {
            setCascadeState(roomState.hardware, mat, sel.installNotes);
          } else if (cat === 'countertops') {
            // Bathroom countertops — no direct slot, skip
          } else {
            // Fallback: try kitchen-style mapping for any remaining categories
            var fc = CATEGORY_MAP[cat];
            if (fc && roomState[fc]) {
              setCascadeState(roomState[fc], mat, sel.installNotes);
            }
          }
        }
      });
    });

    // Re-render rooms and update preview
    if (typeof renderRooms === 'function') renderRooms();
    if (typeof updatePreview === 'function') updatePreview();
  }

  // ── Read Confirmed Data from Overlay Inputs ────────────────────────

  function readConfirmedData(overlay) {
    var buyerRecord = {};
    var buyerInputs = overlay.querySelectorAll('[data-buyer-key]');
    buyerInputs.forEach(function (input) {
      buyerRecord[input.getAttribute('data-buyer-key')] = input.value.trim();
    });

    var finishSelections = [];
    var finishInputs = overlay.querySelectorAll('[data-finish-idx]');
    var finishMap = {};
    finishInputs.forEach(function (input) {
      var idx = input.getAttribute('data-finish-idx');
      var key = input.getAttribute('data-finish-key');
      if (!finishMap[idx]) finishMap[idx] = {};
      finishMap[idx][key] = input.value.trim();
    });
    Object.keys(finishMap).sort(function (a, b) { return a - b; }).forEach(function (idx) {
      finishSelections.push(finishMap[idx]);
    });

    return { buyerRecord: buyerRecord, finishSelections: finishSelections };
  }

  // ── Utility ────────────────────────────────────────────────────────

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Event Wiring ───────────────────────────────────────────────────

  function wireEvents(container, overlay) {
    var toggleBtn = container.querySelector('.cp-toggle-btn');
    var body = container.querySelector('.cp-body');
    var dropzone = container.querySelector('.cp-dropzone');
    var fileInput = container.querySelector('.cp-file-input');
    var statusEl = container.querySelector('.cp-status');
    var statusText = container.querySelector('.cp-status-text');
    var errorEl = container.querySelector('.cp-error');
    var cancelBtn = overlay.querySelector('.cp-btn-cancel');
    var confirmBtn = overlay.querySelector('.cp-btn-confirm');

    // Toggle body visibility
    toggleBtn.addEventListener('click', function () {
      _isVisible = !_isVisible;
      body.classList.toggle('cp-visible', _isVisible);
      toggleBtn.textContent = _isVisible ? 'Hide' : 'Upload Document';
    });

    // Dropzone click -> trigger file picker
    dropzone.addEventListener('click', function () {
      fileInput.click();
    });

    // Drag events
    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropzone.classList.add('cp-dragover');
    });

    dropzone.addEventListener('dragleave', function () {
      dropzone.classList.remove('cp-dragover');
    });

    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('cp-dragover');
      var files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    });

    // File input change
    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
        fileInput.value = ''; // reset so same file can be re-selected
      }
    });

    // Cancel confirmation
    cancelBtn.addEventListener('click', function () {
      overlay.classList.remove('cp-active');
    });

    // Click outside panel to cancel
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.classList.remove('cp-active');
      }
    });

    // Confirm and populate
    confirmBtn.addEventListener('click', function () {
      var data = readConfirmedData(overlay);
      _lastParsedData = data;
      try {
        populateFields(data);
        overlay.classList.remove('cp-active');
        showStatus('Fields populated successfully.', false);
        setTimeout(function () { hideStatus(); }, 2500);
      } catch (err) {
        console.error('populateFields error:', err);
        showError('Failed to populate fields: ' + (err.message || err));
      }
    });

    // ── File Processing ──────────────────────────────────────────────

    async function handleFile(file) {
      if (!isAcceptedFile(file)) {
        showError('Unsupported file type. Please upload a PDF, Excel, Word, or image file.');
        return;
      }

      // Max 20MB
      if (file.size > 20 * 1024 * 1024) {
        showError('File is too large. Maximum size is 20 MB.');
        return;
      }

      hideError();
      showStatus('Reading ' + file.name + '...', true);

      try {
        showStatus('Uploading document to AI...', true);
        var parsed = await extractFromDocument(file);
        hideStatus();

        // Show confirmation overlay
        renderBuyerFields(overlay, parsed.buyerRecord);
        renderFinishSelections(overlay, parsed.finishSelections);
        overlay.classList.add('cp-active');
      } catch (err) {
        hideStatus();
        showError(err.message || 'Failed to extract data from document.');
      }
    }

    function showStatus(msg, spinning) {
      statusText.textContent = msg;
      var spinner = statusEl.querySelector('.cp-spinner');
      spinner.style.display = spinning ? '' : 'none';
      statusEl.classList.add('cp-active');
    }

    function hideStatus() {
      statusEl.classList.remove('cp-active');
    }

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.classList.add('cp-active');
    }

    function hideError() {
      errorEl.classList.remove('cp-active');
    }
  }

  // ── Public API ─────────────────────────────────────────────────────

  function init() {
    injectStyles();

    _containerEl = createUploadUI();
    var overlay = createConfirmationOverlay();

    // Insert at the TOP of .input-panel, above the "Build Presentation" heading
    var inputPanel = document.querySelector('.input-panel');
    if (!inputPanel) {
      console.error('ContractParser: .input-panel not found. Cannot initialize.');
      return;
    }
    inputPanel.insertBefore(_containerEl, inputPanel.firstChild);

    // Overlay appended to body
    document.body.appendChild(overlay);

    wireEvents(_containerEl, overlay);
  }

  function show() {
    if (!_containerEl) return;
    _isVisible = true;
    var body = _containerEl.querySelector('.cp-body');
    var btn = _containerEl.querySelector('.cp-toggle-btn');
    body.classList.add('cp-visible');
    btn.textContent = 'Hide';
  }

  function hide() {
    if (!_containerEl) return;
    _isVisible = false;
    var body = _containerEl.querySelector('.cp-body');
    var btn = _containerEl.querySelector('.cp-toggle-btn');
    body.classList.remove('cp-visible');
    btn.textContent = 'Upload Document';
  }

  function getLastParsedData() {
    return _lastParsedData;
  }

  return {
    init: init,
    show: show,
    hide: hide,
    getLastParsedData: getLastParsedData
  };
})();
