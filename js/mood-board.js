// Mood Board Generation Module for HCHC Presentation Engine
// Generates AI mood boards from confirmed finish selections using Imagen via Gemini API.

const MoodBoard = (() => {
  let generatedImageData = null; // base64 data URL of the generated image
  let isLoading = false;

  // Inject scoped CSS
  function injectStyles() {
    if (document.getElementById('mood-board-gen-styles')) return;
    const style = document.createElement('style');
    style.id = 'mood-board-gen-styles';
    style.textContent = `
      .mb-gen-section {
        margin-top: 20px;
        padding: 16px;
        border: 1px dashed var(--sand, #D4C5B2);
        background: var(--ivory, #F5F0EB);
      }
      .mb-gen-label {
        font-size: 0.68rem;
        font-weight: 300;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--mocha, #A37762);
        margin-bottom: 10px;
      }
      .mb-gen-btn {
        font-family: var(--body, 'Jost', sans-serif);
        font-weight: 300;
        font-size: 0.82rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 14px 28px;
        border: none;
        cursor: pointer;
        transition: background 0.2s;
        width: 100%;
        background: var(--navy, #1B2A4A);
        color: var(--ivory, #F5F0EB);
      }
      .mb-gen-btn:hover { background: var(--mocha, #A37762); }
      .mb-gen-btn:disabled { background: var(--sand, #D4C5B2); cursor: default; }
      .mb-gen-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 20px;
        font-family: var(--body, 'Jost', sans-serif);
        font-size: 0.82rem;
        font-weight: 300;
        color: var(--mocha, #A37762);
      }
      .mb-gen-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--sand, #D4C5B2);
        border-top-color: var(--gold, #C4A265);
        border-radius: 50%;
        animation: mb-spin 0.8s linear infinite;
      }
      @keyframes mb-spin {
        to { transform: rotate(360deg); }
      }
      .mb-gen-preview {
        margin-top: 12px;
      }
      .mb-gen-preview img {
        width: 100%;
        border-radius: 4px;
        border: 1px solid var(--sand, #D4C5B2);
        display: block;
      }
      .mb-gen-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      .mb-gen-actions button {
        flex: 1;
      }
      .mb-gen-download {
        font-family: var(--body, 'Jost', sans-serif);
        font-weight: 300;
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 10px 16px;
        border: 1px solid var(--navy, #1B2A4A);
        background: transparent;
        color: var(--navy, #1B2A4A);
        cursor: pointer;
        transition: background 0.2s;
      }
      .mb-gen-download:hover { background: var(--ivory, #F5F0EB); }
      .mb-gen-retry {
        font-family: var(--body, 'Jost', sans-serif);
        font-weight: 300;
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 10px 16px;
        border: 1px solid var(--mocha, #A37762);
        background: transparent;
        color: var(--mocha, #A37762);
        cursor: pointer;
        transition: background 0.2s;
      }
      .mb-gen-retry:hover { background: var(--ivory, #F5F0EB); }
      .mb-gen-error {
        margin-top: 12px;
        padding: 10px 12px;
        background: #FFF3E0;
        color: #E65100;
        font-size: 0.82rem;
        font-weight: 300;
        line-height: 1.5;
        border-radius: 2px;
      }
      .mb-gen-hint {
        font-size: 0.72rem;
        font-style: italic;
        color: var(--mocha, #A37762);
        line-height: 1.5;
        margin-top: 8px;
        padding: 8px 10px;
        background: #fff;
        border-left: 3px solid var(--gold, #C4A265);
      }
    `;
    document.head.appendChild(style);
  }

  // Build the Imagen prompt from finish selections
  function buildPrompt(selections) {
    const descriptions = selections
      .map(s => {
        const parts = [s.product, s.color, s.finish, s.material].filter(Boolean);
        return parts.join(' ');
      })
      .filter(d => d.length > 0);

    const finishList = descriptions.join(', ');

    return `A photo-realistic styled flat-lay of interior finish samples — ${finishList} — arranged on a neutral warm white surface with soft natural lighting. Editorial interior design photography. No text. Make it look like a curated mood board to be featured on the front cover of an interior design magazine.`;
  }

  // Collect confirmed selections from the global rooms array (presentation engine data)
  function collectSelectionsFromRooms() {
    // Access the global `rooms` variable from presentation-engine.html
    if (typeof rooms === 'undefined' || !Array.isArray(rooms)) return [];

    const selections = [];

    rooms.forEach(room => {
      // Flooring (all room types)
      if (room.flooring) {
        room.flooring.forEach(f => {
          if (f.material) {
            selections.push({
              product: f.material,
              color: f.color || '',
              finish: f.finish || '',
              material: ''
            });
          }
        });
      }

      if (room.type === 'kitchen') {
        // Kitchen categories
        const kitchenCats = ['backsplash', 'countertop', 'cabinet', 'hardware'];
        kitchenCats.forEach(cat => {
          const sel = room[cat];
          if (sel && sel.material) {
            selections.push({
              product: sel.material,
              color: sel.color || '',
              finish: sel.finish || '',
              material: ''
            });
          }
        });
      } else if (room.type === 'bathroom') {
        // Bathroom sub-sections
        const bathCats = ['showerWall', 'showerFloor', 'showerNiche', 'tubSurround', 'vanityTop', 'vanityBacksplash'];
        bathCats.forEach(cat => {
          const sel = room[cat];
          if (sel && sel.material) {
            selections.push({
              product: sel.material,
              color: sel.color || '',
              finish: sel.finish || '',
              material: ''
            });
          }
        });
      }
    });

    return selections;
  }

  // Render the mood board section into a container
  function renderUI(container) {
    container.innerHTML = '';

    const section = document.createElement('div');
    section.className = 'mb-gen-section';
    section.id = 'mb-gen-section';

    const label = document.createElement('div');
    label.className = 'mb-gen-label';
    label.textContent = 'Mood Board';
    section.appendChild(label);

    if (isLoading) {
      const loading = document.createElement('div');
      loading.className = 'mb-gen-loading';
      loading.innerHTML = '<div class="mb-gen-spinner"></div><span>Generating mood board...</span>';
      section.appendChild(loading);
    } else if (generatedImageData) {
      // Preview
      const preview = document.createElement('div');
      preview.className = 'mb-gen-preview';
      const img = document.createElement('img');
      img.src = generatedImageData;
      img.alt = 'Generated mood board';
      preview.appendChild(img);
      section.appendChild(preview);

      // Actions: Download + Regenerate
      const actions = document.createElement('div');
      actions.className = 'mb-gen-actions';

      const dlBtn = document.createElement('button');
      dlBtn.className = 'mb-gen-download';
      dlBtn.textContent = 'Download';
      dlBtn.addEventListener('click', () => downloadImage());
      actions.appendChild(dlBtn);

      const regenBtn = document.createElement('button');
      regenBtn.className = 'mb-gen-retry';
      regenBtn.textContent = 'Regenerate';
      regenBtn.addEventListener('click', () => {
        const selections = collectSelectionsFromRooms();
        MoodBoard.generate(selections);
      });
      actions.appendChild(regenBtn);

      section.appendChild(actions);
    } else {
      // Generate button
      const btn = document.createElement('button');
      btn.className = 'mb-gen-btn';
      btn.textContent = 'Generate Mood Board';
      btn.addEventListener('click', () => {
        const selections = collectSelectionsFromRooms();
        if (selections.length === 0) {
          showError(container, 'Add finish selections to at least one room before generating a mood board.');
          return;
        }
        MoodBoard.generate(selections);
      });
      section.appendChild(btn);

      const hint = document.createElement('div');
      hint.className = 'mb-gen-hint';
      hint.textContent = 'Creates an AI-generated flat-lay mood board from your confirmed finish selections. Used as the cover page image in the PDF presentation.';
      section.appendChild(hint);
    }

    container.appendChild(section);
  }

  // Show an error message with retry
  function showError(container, message) {
    // Remove any existing error
    const existing = container.querySelector('.mb-gen-error');
    if (existing) existing.remove();

    const errDiv = document.createElement('div');
    errDiv.className = 'mb-gen-error';
    errDiv.textContent = message;
    container.querySelector('.mb-gen-section').appendChild(errDiv);
  }

  // Download the generated image
  function downloadImage() {
    if (!generatedImageData) return;
    const link = document.createElement('a');
    link.href = generatedImageData;
    link.download = 'hchc-mood-board.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Find or create the mood board container. Replaces the old upload section if present.
  function getContainer() {
    let container = document.getElementById('mb-gen-root');
    if (container) return container;

    // Replace old mood board section if it exists
    const oldSection = document.querySelector('.mood-board-section');
    if (oldSection) {
      container = document.createElement('div');
      container.id = 'mb-gen-root';
      oldSection.parentNode.replaceChild(container, oldSection);
      return container;
    }

    // Fallback: insert before the generate section
    const genSection = document.querySelector('.generate-section');
    if (genSection) {
      container = document.createElement('div');
      container.id = 'mb-gen-root';
      genSection.parentNode.insertBefore(container, genSection);
      return container;
    }

    return null;
  }

  // Toast helper (uses presentation engine toast if available, otherwise console)
  function toast(message, type) {
    if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      console.log(`[MoodBoard ${type}] ${message}`);
    }
  }

  // Public API
  return {
    /**
     * Initialize the mood board module. Replaces the old upload section with the generate UI.
     */
    init() {
      injectStyles();
      const container = getContainer();
      if (container) {
        renderUI(container);
      }
    },

    /**
     * Generate a mood board from finish selections.
     * @param {Array} selections - Array of { product, color, finish, material }
     */
    async generate(selections) {
      if (!selections || selections.length === 0) {
        toast('No finish selections provided.', 'info');
        return;
      }

      const container = getContainer();
      if (!container) return;

      isLoading = true;
      generatedImageData = null;
      renderUI(container);

      const prompt = buildPrompt(selections);

      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'imagen-4.0-generate-001',
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ['IMAGE'],
              imagenConfig: { aspectRatio: '3:4' }
            }
          })
        });

        const result = await response.json();

        if (!response.ok) {
          const msg = result.error?.message || `API returned ${response.status}`;
          if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('API quota exceeded. Please check your Google Cloud billing or try again later.');
          }
          throw new Error(msg.substring(0, 200));
        }

        // Extract the image from the response
        const parts = result.candidates?.[0]?.content?.parts || [];
        const imgPart = parts.find(p => p.inlineData);

        if (imgPart && imgPart.inlineData) {
          generatedImageData = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;

          // Also set the global moodBoardUrl so the PDF generator picks it up
          if (typeof window !== 'undefined') {
            window.moodBoardUrl = generatedImageData;
          }

          toast('Mood board generated successfully.', 'success');
        } else {
          throw new Error('The API returned a response but no image was included. Try regenerating.');
        }
      } catch (err) {
        console.error('MoodBoard generation failed:', err);
        isLoading = false;
        renderUI(container);
        showError(container, err.message || 'Mood board generation failed. Please try again.');
        return;
      }

      isLoading = false;
      renderUI(container);

      // Trigger preview update if the function exists
      if (typeof updatePreview === 'function') {
        updatePreview();
      }
    },

    /**
     * Returns the generated image data (base64 data URL) or null.
     * @returns {string|null}
     */
    getImage() {
      return generatedImageData;
    },

    /**
     * Whether a mood board has been generated.
     * @returns {boolean}
     */
    isGenerated() {
      return generatedImageData !== null;
    },

    /**
     * Reset the module state (useful when starting a new presentation).
     */
    reset() {
      generatedImageData = null;
      isLoading = false;
      const container = getContainer();
      if (container) renderUI(container);
    }
  };
})();
