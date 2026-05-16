// Diagram Auto-Suggestion Module for HCHC Presentation Engine
// Suggests installation diagrams from the diagram library based on parsed change order data.

const DiagramSuggest = (() => {
  let library = null;
  const selectedDiagrams = {};

  // Pattern keywords used for matching
  const PATTERN_KEYWORDS = [
    'herringbone', 'chevron', 'running bond', 'brick lay', 'bricklap',
    'stacked', 'straight lay', 'straight stack', 'basket weave',
    'basketweave', 'pinwheel', 'windmill', 'versailles', 'hopscotch',
    'crosshatch', 'diamond', 'diagonal', 'subway', 'linear',
    'offset', 'one-third offset', 'half offset', 'modular', 'ashlar',
    'cobblestone', 'mosaic', 'hexagonal', 'hex', 'arabesque',
    'fish scale', 'scallop', 'plank', 'wood plank'
  ];

  // Category aliases for flexible matching
  const CATEGORY_ALIASES = {
    kitchen: ['kitchen', 'backsplash', 'countertop', 'counter'],
    wall: ['wall', 'shower wall', 'tub surround', 'accent wall', 'wainscot', 'backsplash'],
    floor: ['floor', 'flooring', 'shower floor', 'bathroom floor', 'tile floor']
  };

  // Inject scoped CSS
  function injectStyles() {
    if (document.getElementById('diagram-suggest-styles')) return;
    const style = document.createElement('style');
    style.id = 'diagram-suggest-styles';
    style.textContent = `
      .ds-container {
        margin-top: 10px;
      }
      .ds-label {
        font-size: 0.65rem;
        font-weight: 300;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--dusty-blue, #7B9BAE);
        margin-bottom: 6px;
      }
      .ds-thumbnails {
        display: flex;
        flex-direction: row;
        gap: 10px;
        flex-wrap: wrap;
      }
      .ds-thumb-wrapper {
        width: 120px;
        cursor: pointer;
        text-align: center;
      }
      .ds-thumb-container {
        width: 120px;
        height: 120px;
        overflow: hidden;
        border: 2px solid var(--sand, #D4C5B2);
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        transition: border-color 0.2s;
      }
      .ds-thumb-wrapper.selected .ds-thumb-container {
        border-color: var(--gold, #C4A265);
      }
      .ds-thumb-container img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.2s;
      }
      .ds-thumb-name {
        font-family: var(--body, 'Jost', sans-serif);
        font-size: 0.7rem;
        font-weight: 300;
        color: var(--espresso, #3C2A21);
        margin-top: 4px;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ds-confidence {
        font-size: 0.6rem;
        font-weight: 300;
        letter-spacing: 0.05em;
        margin-top: 2px;
      }
      .ds-confidence.high { color: var(--sage, #8A9A7B); }
      .ds-confidence.medium { color: var(--gold, #C4A265); }
      .ds-confidence.low { color: var(--sand, #D4C5B2); }
      .ds-disclaimer {
        font-size: 0.65rem;
        font-style: italic;
        color: var(--mocha, #A37762);
        margin-top: 8px;
        line-height: 1.4;
      }
      .ds-none {
        font-size: 0.75rem;
        font-weight: 300;
        color: var(--sand, #D4C5B2);
        font-style: italic;
        padding: 8px 0;
      }
    `;
    document.head.appendChild(style);
  }

  // Normalize text for comparison
  function normalize(text) {
    return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Extract a rotation angle from text (e.g., "herringbone at 45 degrees", "horizontal")
  function extractRotation(text) {
    const norm = normalize(text);
    // Explicit degree mention
    const degMatch = norm.match(/(\d+)\s*deg/);
    if (degMatch) return parseInt(degMatch[1], 10);
    // Keyword-based orientation
    if (/\bvertical\b/.test(norm)) return 90;
    if (/\bhorizontal\b/.test(norm)) return 0;
    return 0;
  }

  // Score a single diagram against a selection
  function scoreDiagram(diagram, selection) {
    let score = 0;
    const selText = normalize(
      [selection.category, selection.product, selection.notes, selection.pattern].join(' ')
    );
    const diagTags = normalize(
      [diagram.name, diagram.category, diagram.pattern, ...(diagram.tags || [])].join(' ')
    );

    // Category match (+30)
    const selCategory = normalize(selection.category);
    for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
      const selHit = aliases.some(a => selCategory.includes(a));
      const diagHit = aliases.some(a => diagTags.includes(a));
      if (selHit && diagHit) {
        score += 30;
        break;
      }
    }

    // Pattern keyword match (+40)
    for (const kw of PATTERN_KEYWORDS) {
      if (selText.includes(kw) && diagTags.includes(kw)) {
        score += 40;
        break;
      }
    }

    // Tile size match (+20)
    const sizeRegex = /(\d+)\s*[x×]\s*(\d+)/g;
    const selSizes = [];
    let m;
    while ((m = sizeRegex.exec(selText)) !== null) {
      selSizes.push(`${m[1]}x${m[2]}`);
    }
    if (selSizes.length > 0) {
      const diagSizeStr = normalize((diagram.sizes || []).join(' '));
      for (const s of selSizes) {
        if (diagSizeStr.includes(s)) {
          score += 20;
          break;
        }
      }
    }

    // Orientation match (+10)
    const orientations = ['horizontal', 'vertical', 'diagonal'];
    for (const ori of orientations) {
      if (selText.includes(ori) && diagTags.includes(ori)) {
        score += 10;
        break;
      }
    }

    return score;
  }

  // Public API
  return {
    /**
     * Load the diagram library JSON.
     */
    async init() {
      injectStyles();
      try {
        const resp = await fetch('/data/diagram-library.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        library = await resp.json();
      } catch (err) {
        console.warn('DiagramSuggest: Could not load diagram library:', err.message);
        library = { diagrams: [] };
      }
    },

    /**
     * Returns ranked array of { file, name, score, rotation, confidenceLabel }.
     * @param {Object} selection - { category, product, notes, pattern, size }
     * @returns {Array}
     */
    suggest(selection) {
      if (!library || !library.diagrams || library.diagrams.length === 0) return [];

      const rotation = extractRotation(
        [selection.notes, selection.pattern, selection.product].join(' ')
      );

      const scored = library.diagrams.map(d => {
        const score = scoreDiagram(d, selection);
        // Diagram-level rotation override: combine selection rotation with diagram default
        const diagRotation = (d.defaultRotation || 0) + rotation;
        return {
          file: d.file,
          name: d.name || d.file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          score,
          rotation: diagRotation,
          confidenceLabel: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'
        };
      });

      // Sort by score descending, then alphabetical
      scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

      // Return top 3 with score > 0
      return scored.filter(d => d.score > 0).slice(0, 3);
    },

    /**
     * Renders suggestion thumbnails into a container element.
     * @param {string} containerId - DOM id of the container
     * @param {Object} selection - { category, product, notes, pattern, size, id }
     * @param {Function} onSelect - Called with (diagramObj) when user clicks a thumbnail
     */
    renderSuggestions(containerId, selection, onSelect) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';

      const suggestions = this.suggest(selection);

      if (suggestions.length === 0) {
        container.innerHTML = '<div class="ds-container"><div class="ds-none">No matching diagrams found.</div></div>';
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'ds-container';

      const label = document.createElement('div');
      label.className = 'ds-label';
      label.textContent = 'Suggested Diagrams';
      wrap.appendChild(label);

      const row = document.createElement('div');
      row.className = 'ds-thumbnails';

      const selId = selection.id || containerId;
      const currentSelected = selectedDiagrams[selId];

      suggestions.forEach(diag => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ds-thumb-wrapper';
        if (currentSelected && currentSelected.file === diag.file) {
          wrapper.classList.add('selected');
        }

        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'ds-thumb-container';

        const img = document.createElement('img');
        img.src = `/images/diagrams/${diag.file}`;
        img.alt = diag.name;
        img.loading = 'lazy';
        if (diag.rotation !== 0) {
          img.style.transform = `rotate(${diag.rotation}deg)`;
        }
        thumbContainer.appendChild(img);

        const nameEl = document.createElement('div');
        nameEl.className = 'ds-thumb-name';
        nameEl.textContent = diag.name;
        nameEl.title = diag.name;

        const confEl = document.createElement('div');
        confEl.className = `ds-confidence ${diag.confidenceLabel}`;
        confEl.textContent = diag.confidenceLabel === 'high' ? 'Strong match'
          : diag.confidenceLabel === 'medium' ? 'Possible match' : 'Weak match';

        wrapper.appendChild(thumbContainer);
        wrapper.appendChild(nameEl);
        wrapper.appendChild(confEl);

        wrapper.addEventListener('click', () => {
          // Deselect siblings
          row.querySelectorAll('.ds-thumb-wrapper').forEach(w => w.classList.remove('selected'));
          wrapper.classList.add('selected');
          selectedDiagrams[selId] = diag;
          if (typeof onSelect === 'function') onSelect(diag);
        });

        row.appendChild(wrapper);
      });

      wrap.appendChild(row);

      const disclaimer = document.createElement('div');
      disclaimer.className = 'ds-disclaimer';
      disclaimer.textContent = 'Diagrams vary and may not be to scale.';
      wrap.appendChild(disclaimer);

      container.appendChild(wrap);
    },

    /**
     * Returns the currently selected diagram for a given selection id.
     * @param {string} selectionId
     * @returns {Object|null} { file, name, score, rotation, confidenceLabel }
     */
    getSelectedDiagram(selectionId) {
      return selectedDiagrams[selectionId] || null;
    },

    /**
     * Clear all selections (useful on reset).
     */
    clearSelections() {
      Object.keys(selectedDiagrams).forEach(k => delete selectedDiagrams[k]);
    }
  };
})();
