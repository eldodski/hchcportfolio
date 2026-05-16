/* ============================================================
   HCHC Material Library Image Fetch Module
   Checks material library for product images, fetches missing
   ones via manufacturer sites / image search with designer
   confirmation before adding.
   ============================================================ */

const MaterialFetch = (function () {
  'use strict';

  let _pendingFetches = [];
  let _style = null;

  function _injectStyles() {
    if (_style) return;
    _style = document.createElement('style');
    _style.textContent = `
      .mf-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .mf-modal {
        background: var(--ivory, #F5F0EB);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        padding: 32px;
        position: relative;
      }
      .mf-modal h3 {
        font-family: var(--heading, 'Cormorant Garamond', serif);
        font-weight: 600;
        font-size: 1.3rem;
        color: var(--navy, #1B2A4A);
        margin-bottom: 8px;
      }
      .mf-modal p {
        font-size: 0.85rem;
        color: var(--mocha, #A37762);
        margin-bottom: 20px;
      }
      .mf-product-name {
        font-family: var(--heading, 'Cormorant Garamond', serif);
        font-weight: 600;
        font-size: 1.1rem;
        color: var(--navy, #1B2A4A);
        margin-bottom: 12px;
      }
      .mf-thumbs {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .mf-thumb {
        width: 160px;
        height: 160px;
        border: 2px solid var(--sand, #D4C5B2);
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: border-color 0.2s;
      }
      .mf-thumb:hover { border-color: var(--gold, #C4A265); }
      .mf-thumb.selected { border-color: var(--gold, #C4A265); border-width: 3px; }
      .mf-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .mf-thumb-check {
        display: none;
        position: absolute;
        top: 6px;
        right: 6px;
        width: 24px;
        height: 24px;
        background: var(--gold, #C4A265);
        color: #fff;
        font-size: 14px;
        line-height: 24px;
        text-align: center;
        border-radius: 50%;
      }
      .mf-thumb.selected .mf-thumb-check { display: block; }
      .mf-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .mf-btn {
        font-family: var(--body, 'Jost', sans-serif);
        font-size: 0.8rem;
        font-weight: 400;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 10px 24px;
        border: none;
        cursor: pointer;
        transition: background 0.2s;
      }
      .mf-btn-primary {
        background: var(--navy, #1B2A4A);
        color: var(--ivory, #F5F0EB);
      }
      .mf-btn-primary:hover { background: var(--espresso, #3C2A21); }
      .mf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .mf-btn-secondary {
        background: transparent;
        color: var(--mocha, #A37762);
        border: 1px solid var(--sand, #D4C5B2);
      }
      .mf-btn-secondary:hover { border-color: var(--navy, #1B2A4A); color: var(--navy, #1B2A4A); }
      .mf-loading {
        text-align: center;
        padding: 40px;
        color: var(--mocha, #A37762);
        font-size: 0.9rem;
      }
      .mf-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--sand, #D4C5B2);
        border-top-color: var(--gold, #C4A265);
        border-radius: 50%;
        animation: mf-spin 0.8s linear infinite;
        margin: 0 auto 12px;
      }
      @keyframes mf-spin { to { transform: rotate(360deg); } }
      .mf-skip-link {
        font-size: 0.78rem;
        color: var(--dusty-blue, #7B9BAE);
        text-decoration: underline;
        cursor: pointer;
        margin-left: 12px;
      }
    `;
    document.head.appendChild(_style);
  }

  // Check which selections are missing images in the material library
  async function checkMissing(selections, allMaterials) {
    const missing = [];
    for (const sel of selections) {
      const match = allMaterials.find(m =>
        m.name && sel.productName &&
        m.name.toLowerCase().includes(sel.productName.toLowerCase())
      );
      if (!match || !match.image_url) {
        missing.push(sel);
      }
    }
    return missing;
  }

  // Search for product images via Gemini (text search simulation)
  // In production this would hit manufacturer APIs or a search service
  // For now, we use Gemini to suggest search terms and show placeholder results
  async function searchImages(productName, color) {
    const searchTerm = `${productName} ${color || ''}`.trim();

    // Try to fetch via the Gemini API to get image suggestions
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          contents: [{
            parts: [{
              text: `I need to find product images for this interior design material: "${searchTerm}".

              Return a JSON array of 3 search URLs that would find this product image on manufacturer websites. Format:
              [
                {"url": "manufacturer product page URL", "source": "manufacturer name"},
                {"url": "alternate search URL", "source": "source name"},
                {"url": "google images search URL", "source": "Google Images"}
              ]

              Return ONLY the JSON array, no other text.`
            }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        try {
          const urls = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
          return urls;
        } catch (e) {
          // Fallback
        }
      }
    } catch (e) {
      console.warn('Image search failed:', e);
    }

    // Fallback: return placeholder search URLs
    const encoded = encodeURIComponent(searchTerm + ' tile');
    return [
      { url: `https://www.google.com/search?tbm=isch&q=${encoded}`, source: 'Google Images' },
      { url: `https://www.msisurfaces.com/search?q=${encodeURIComponent(searchTerm)}`, source: 'MSI' },
      { url: `https://www.daltile.com/search?q=${encodeURIComponent(searchTerm)}`, source: 'Daltile' },
    ];
  }

  // Show confirmation modal for a missing material image
  function showConfirmation(selection, imageResults, onConfirm, onSkip) {
    _injectStyles();

    const overlay = document.createElement('div');
    overlay.className = 'mf-overlay';

    let selectedUrl = null;

    const modal = document.createElement('div');
    modal.className = 'mf-modal';
    modal.innerHTML = `
      <h3>Product Image Not Found</h3>
      <p>The material library does not have an image for this product. Select an image below or skip to continue without one.</p>
      <div class="mf-product-name">${_esc(selection.productName)} ${selection.color ? '— ' + _esc(selection.color) : ''}</div>
      <p style="font-size:0.78rem; color: var(--dusty-blue);">Search for this product image, then upload or paste the URL below.</p>
      <div style="margin-bottom: 16px;">
        <div style="font-size: 0.75rem; color: var(--mocha); margin-bottom: 8px;">Quick search links:</div>
        ${imageResults.map(r => `<a href="${r.url}" target="_blank" rel="noopener" style="display:inline-block; margin-right: 12px; font-size: 0.78rem; color: var(--navy); text-decoration: underline;">${_esc(r.source)}</a>`).join('')}
      </div>
      <div style="margin-bottom: 16px;">
        <label style="font-size: 0.78rem; font-weight: 400; color: var(--espresso); display: block; margin-bottom: 4px;">Paste image URL or upload file:</label>
        <input type="text" id="mf-image-url" placeholder="https://..." style="width: 100%; padding: 8px 12px; border: 1px solid var(--sand); font-family: var(--body); font-size: 0.85rem;">
        <div style="margin-top: 8px;">
          <input type="file" id="mf-image-file" accept=".jpg,.jpeg,.png,.webp" style="font-size: 0.78rem;">
        </div>
      </div>
      <div id="mf-preview-container" style="display:none; margin-bottom: 16px;">
        <img id="mf-preview-img" style="max-width: 200px; max-height: 200px; border: 2px solid var(--sand);">
      </div>
      <div class="mf-actions">
        <span class="mf-skip-link" id="mf-skip">Skip this product</span>
        <button class="mf-btn mf-btn-primary" id="mf-confirm" disabled>Confirm Image</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // URL input preview
    const urlInput = modal.querySelector('#mf-image-url');
    const fileInput = modal.querySelector('#mf-image-file');
    const previewContainer = modal.querySelector('#mf-preview-container');
    const previewImg = modal.querySelector('#mf-preview-img');
    const confirmBtn = modal.querySelector('#mf-confirm');
    const skipBtn = modal.querySelector('#mf-skip');

    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim();
      if (url.startsWith('http')) {
        previewImg.src = url;
        previewContainer.style.display = 'block';
        selectedUrl = url;
        confirmBtn.disabled = false;
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewImg.src = ev.target.result;
        previewContainer.style.display = 'block';
        selectedUrl = ev.target.result; // base64
        confirmBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    });

    confirmBtn.addEventListener('click', () => {
      overlay.remove();
      onConfirm(selectedUrl);
    });

    skipBtn.addEventListener('click', () => {
      overlay.remove();
      onSkip();
    });

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        onSkip();
      }
    });
  }

  // Process all missing materials sequentially
  async function processMissing(missingSelections, onComplete) {
    _injectStyles();

    const results = [];
    for (let i = 0; i < missingSelections.length; i++) {
      const sel = missingSelections[i];
      const imageResults = await searchImages(sel.productName, sel.color);

      await new Promise((resolve) => {
        showConfirmation(
          sel,
          imageResults,
          (imageUrl) => {
            results.push({ selection: sel, imageUrl, confirmed: true });
            resolve();
          },
          () => {
            results.push({ selection: sel, imageUrl: null, confirmed: false });
            resolve();
          }
        );
      });
    }

    if (onComplete) onComplete(results);
    return results;
  }

  function _esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return {
    checkMissing,
    searchImages,
    showConfirmation,
    processMissing,
  };
})();
