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
  const EXTRACTION_PROMPT = `You are a document parser for an interior design workflow tool. I am going to upload a change order document. Extract the following fields exactly as they appear in the document and return them in a simple labeled list. If a field is not found, say "not found" and do not guess or infer.

Fields to extract: Builder, Community, Lot, Street Address, Buyer 1 Full Name, Buyer 2 Full Name (if present), Change Order Date, and all product and finish selections listed on the document including product names, colors, and any installation notes.

Do not extract any other information. Do not summarize the document. Return only the requested fields and their values.

Return the result as JSON with this structure:
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
      "category": "",
      "productName": "",
      "color": "",
      "installNotes": ""
    }
  ]
}

Return ONLY the JSON object. No markdown fences, no commentary.`;

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

  // ── API Call ───────────────────────────────────────────────────────

  async function extractFromDocument(file) {
    const base64Data = await readFileAsBase64(file);
    const mimeType = getMimeType(file);

    // Use the file upload endpoint to avoid Vercel body size limits.
    // Uploads file to Gemini File API first, then calls generateContent.
    var response;
    try {
      response = await fetch('/api/gemini-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: mimeType,
          fileName: file.name,
          prompt: EXTRACTION_PROMPT,
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16384
          }
        })
      });
    } catch (networkErr) {
      throw new Error('Network error: Could not reach the server. ' + (networkErr.message || ''));
    }

    if (!response.ok) {
      var errBody;
      try { errBody = await response.json(); } catch (_) { errBody = {}; }
      var errMsg = errBody.error || ('Gemini API returned status ' + response.status);
      throw new Error(errMsg);
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

  function populateFields(data) {
    var br = data.buyerRecord;

    // Project Name: Builder - Community Lot ##
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

    // Client Name: Buyer 1 (& Buyer 2 if present)
    var clientName = br.buyer1Name || '';
    if (br.buyer2Name && br.buyer2Name.toLowerCase() !== 'not found') {
      clientName += ' & ' + br.buyer2Name;
    }
    var clientInput = document.getElementById('client-name');
    if (clientInput && clientName) {
      clientInput.value = clientName;
    }

    // Builder
    var builderInput = document.getElementById('builder-name');
    if (builderInput && br.builder) {
      builderInput.value = br.builder;
    }

    // Address
    var addressInput = document.getElementById('address');
    if (addressInput && br.streetAddress && br.streetAddress.toLowerCase() !== 'not found') {
      addressInput.value = br.streetAddress;
    }

    // Trigger preview update
    if (typeof updatePreview === 'function') {
      updatePreview();
    }
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
      populateFields(data);
      overlay.classList.remove('cp-active');

      // Show brief success feedback
      showStatus('Fields populated successfully.', false);
      setTimeout(function () { hideStatus(); }, 2500);
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
        showStatus('Extracting data from document...', true);
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
