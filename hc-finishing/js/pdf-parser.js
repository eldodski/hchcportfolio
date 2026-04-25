// HC Finishing — PDF Parser Engine
// Extracts text from PDF order forms and parses into structured JSON
// Supports both text-based PDFs (pdf.js) and scanned/image PDFs (Tesseract.js OCR)

// pdf.js worker path (loaded from CDN)
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
}

// OCR progress callback — set by caller to update UI
let ocrProgressCallback = null;

// ============ PDF TEXT EXTRACTION ============

async function parsePDF(file) {
  if (!pdfjsLib) {
    throw new Error('pdf.js library not loaded');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Group text items by Y position to reconstruct lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], text: item.str });
    }

    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    const lines = sortedYs.map(y => {
      const items = lineMap.get(y).sort((a, b) => a.x - b.x);
      return items.map(i => i.text).join(' ');
    });

    pages.push(lines.join('\n'));
  }

  const rawText = pages.join('\n\n--- Page Break ---\n\n');

  // Check if pdf.js found MEANINGFUL text (not just whitespace/artifacts)
  // Strip page breaks, whitespace, and common PDF artifacts to count real content
  const meaningfulText = rawText
    .replace(/---\s*Page Break\s*---/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Count actual word-like tokens (at least 2 chars, contains a letter)
  const wordCount = (meaningfulText.match(/\b[a-zA-Z][a-zA-Z0-9]{1,}\b/g) || []).length;

  if (wordCount >= 10) {
    // Enough real words — use text extraction
    const parsed = extractOrderData(rawText);
    return { raw_text: rawText, parsed, error: null };
  }

  // Scanned/image PDF — fall back to OCR
  if (typeof Tesseract === 'undefined') {
    return {
      raw_text: rawText,
      parsed: null,
      error: 'This is a scanned/image PDF. OCR library is loading — please try again in a moment.'
    };
  }

  const ocrText = await ocrPDF(pdf);
  if (ocrText.trim().length < 20) {
    return {
      raw_text: ocrText || '(no text extracted)',
      parsed: null,
      error: 'Could not extract text from this PDF even with OCR. The scan quality may be too low.'
    };
  }

  const parsed = extractOrderData(ocrText);
  return { raw_text: ocrText, parsed, error: null };
}

// ============ OCR ENGINE (Tesseract.js) ============

async function ocrPDF(pdf) {
  const pageTexts = [];
  const totalPages = pdf.numPages;

  // Create a shared worker for better performance across pages
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m) => {
      if (ocrProgressCallback && m.status === 'recognizing text') {
        ocrProgressCallback(m.progress, totalPages);
      }
    }
  });

  // Configure Tesseract for better accuracy on scanned documents
  await worker.setParameters({
    tessedit_pageseg_mode: '6',       // Assume uniform block of text
    preserve_interword_spaces: '1',   // Keep spacing for table columns
  });

  for (let i = 1; i <= totalPages; i++) {
    if (ocrProgressCallback) {
      ocrProgressCallback(0, totalPages, i);
    }

    const page = await pdf.getPage(i);

    // Render at 4x scale for much better OCR accuracy on scanned forms
    const viewport = page.getViewport({ scale: 4.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // White background (prevents transparency issues)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Preprocess: convert to high-contrast grayscale for better OCR
    preprocessForOCR(ctx, canvas.width, canvas.height);

    // Run OCR on the preprocessed image
    const { data } = await worker.recognize(canvas);
    pageTexts.push(data.text);

    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;
  }

  await worker.terminate();
  return pageTexts.join('\n\n--- Page Break ---\n\n');
}

// Preprocess canvas image for better OCR: grayscale + contrast boost + threshold
function preprocessForOCR(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale using luminance formula
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Apply contrast boost + binarization threshold
    // Pixels above threshold become white, below become black
    const val = gray > 160 ? 255 : (gray < 80 ? 0 : Math.round((gray - 80) * (255 / 80)));

    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    // Alpha stays unchanged
  }

  ctx.putImageData(imageData, 0, 0);
}

// ============ STRUCTURED DATA EXTRACTION ============

function extractOrderData(rawText) {
  const text = rawText.trim();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const warnings = [];

  // Extract builder/project info — supports multiple order form formats
  const builderName = extractField(text, [
    /builder\s*name[:\s]+(.+)/i,
    /builder\s*:\s*(.+)/i,
    /contractor[:\s]+(.+)/i,
    /company[:\s]+(.+)/i,
    // Whitestone-style: look for company name in header
    /(\w+(?:\s+\w+)*\s+(?:custom\s+)?homes)\b/i
  ]);
  if (!builderName) warnings.push('Could not identify builder name');

  // Buyer/homeowner name (common in selection sheets)
  const buyerName = extractField(text, [
    /buyer\s*[:\s]+(.+)/i,
    /purchaser\s*[:\s]+(.+)/i,
    /homeowner\s*[:\s]+(.+)/i,
    /owner\s*[:\s]+(.+)/i,
    /client\s*[:\s]+(.+)/i
  ]);

  const projectName = extractField(text, [
    /project[:\s]+(.+)/i,
    /community[:\s]+(.+)/i,
    /subdivision[:\s]+(.+)/i
  ]);

  const lotNumber = extractField(text, [
    /lot\s*#?\s*[:\s]+(\S+)/i,
    /lot\s+(\d+)/i
  ]);

  const address = extractField(text, [
    /lot\s*address\s*[:\s]+(.+)/i,
    /address[:\s]+(.+)/i,
    /location[:\s]+(.+)/i,
    /(\d+\s+\w+\s+(st|street|ave|avenue|blvd|dr|drive|ln|lane|ct|court|way|rd|road)[\w\s,]*)/i
  ]);

  // Extract rooms and materials
  const rooms = extractRooms(text, lines);
  if (rooms.length === 0) warnings.push('Could not identify specific rooms — materials listed as "General"');

  // Calculate parse confidence
  let score = 0;
  if (builderName) score += 2;
  if (buyerName) score += 1;
  if (projectName) score += 1;
  if (lotNumber) score += 1;
  if (address) score += 1;
  if (rooms.length > 0) score += 3;
  if (rooms.some(r => r.materials.length > 0)) score += 2;

  let confidence = 'low';
  if (score >= 7) confidence = 'high';
  else if (score >= 4) confidence = 'medium';

  return {
    builder_name: builderName || '',
    buyer_name: buyerName || '',
    project_name: projectName || '',
    lot_number: lotNumber || '',
    address: address || '',
    rooms: rooms,
    raw_text: text,
    parse_confidence: confidence,
    parse_warnings: warnings
  };
}

// ============ ROOM/MATERIAL EXTRACTION ============

const ROOM_PATTERNS = [
  /kitchen/i, /bathroom/i, /bath\b/i, /master\s*(bed|suite|bath)/i,
  /living\s*room/i, /family\s*room/i, /dining/i, /bedroom/i,
  /laundry/i, /mudroom/i, /entry/i, /foyer/i, /hallway/i,
  /garage/i, /office/i, /study/i, /bonus\s*room/i, /guest/i,
  /powder/i, /utility/i, /closet/i, /pantry/i
];

// Selection sheet section headers (e.g. Whitestone format)
const SECTION_PATTERNS = [
  /^(?:ext\.?\s*)?door\s*[\/&]\s*hardware/i,
  /^cabinet/i, /^cabinetry/i,
  /^paint/i, /^lighting/i, /^fireplace/i,
  /^flooring/i, /^countertop/i, /^backsplash/i,
  /^plumbing/i, /^fixture/i, /^appliance/i,
  /^tile/i, /^mirror/i, /^window/i,
  /^shelving/i, /^stair/i, /^railing/i,
  /^exterior/i, /^interior/i,
  /^deco\s*[a-z]/i  // "DECO A", "DECO B" etc.
];

const MATERIAL_CATEGORIES = [
  { pattern: /flooring|floor|tile|hardwood|lvp|lvt|carpet|laminate/i, category: 'Flooring' },
  { pattern: /countertop|counter|granite|quartz|marble|butcher/i, category: 'Countertops' },
  { pattern: /cabinet|cabinetry/i, category: 'Cabinetry' },
  { pattern: /backsplash|splash/i, category: 'Backsplash' },
  { pattern: /paint|wall\s*color|sherwin|benjamin/i, category: 'Paint' },
  { pattern: /fixture|faucet|sink|shower|tub|toilet/i, category: 'Fixtures' },
  { pattern: /hardware|knob|pull|handle/i, category: 'Hardware' },
  { pattern: /lighting|light|chandelier|pendant|sconce/i, category: 'Lighting' },
  { pattern: /mirror/i, category: 'Mirrors' },
  { pattern: /window|blind|shade|curtain|drape/i, category: 'Window Treatments' }
];

function extractRooms(text, lines) {
  const rooms = [];
  let currentRoom = null;

  for (const line of lines) {
    // Check if this line is a room header
    const roomMatch = ROOM_PATTERNS.find(p => p.test(line));
    if (roomMatch && line.length < 60) {
      if (currentRoom) rooms.push(currentRoom);
      currentRoom = { name: cleanRoomName(line), materials: [] };
      continue;
    }

    // Check if this line is a section header (selection sheet format)
    const sectionMatch = SECTION_PATTERNS.find(p => p.test(line.trim()));
    if (sectionMatch && line.trim().length < 60) {
      if (currentRoom) rooms.push(currentRoom);
      currentRoom = { name: cleanRoomName(line), materials: [] };
      continue;
    }

    // Try to extract material from this line
    const material = extractMaterial(line);
    if (material) {
      if (!currentRoom) {
        currentRoom = { name: 'General', materials: [] };
      }
      currentRoom.materials.push(material);
    }

    // For selection sheet rows: even if no material category match,
    // capture non-trivial lines under the current section as raw entries
    if (!material && currentRoom && line.trim().length > 3) {
      const selectionEntry = extractSelectionRow(line);
      if (selectionEntry) {
        currentRoom.materials.push(selectionEntry);
      }
    }
  }

  if (currentRoom) rooms.push(currentRoom);

  // If no rooms found, try to extract all materials into a single "General" room
  if (rooms.length === 0) {
    const allMaterials = [];
    for (const line of lines) {
      const material = extractMaterial(line);
      if (material) allMaterials.push(material);
    }
    if (allMaterials.length > 0) {
      rooms.push({ name: 'General', materials: allMaterials });
    }
  }

  return rooms;
}

// Extract a row from selection sheet tables (e.g. "Kitchen  Maple  LVL  Standard  Shaker  Espresso")
function extractSelectionRow(line) {
  const trimmed = line.trim();

  // Skip lines that look like headers, labels, dates, or page artifacts
  if (/^(item|style|co#|line#|color|finish|description|qty|page|date|\d{1,2}\/\d{1,2})/i.test(trimmed)) return null;
  if (/^(selection\s*sheet|whitestone|deco\s|buyer|lot\s*address|subdivision)/i.test(trimmed)) return null;
  if (trimmed.length < 4) return null;

  // If line has multiple segments separated by spaces/tabs (table row), capture it
  const parts = trimmed.split(/\s{2,}|\t+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      category: 'Selection',
      product: parts.slice(0, 2).join(' — '),
      color: parts.length > 2 ? parts[parts.length - 1] : '',
      quantity: '',
      notes: parts.length > 3 ? parts.slice(2, -1).join(', ') : ''
    };
  }

  return null;
}

function extractMaterial(line) {
  const catMatch = MATERIAL_CATEGORIES.find(c => c.pattern.test(line));
  if (!catMatch) return null;

  // Try to extract product details
  const parts = line.split(/[,\-\|:]/);
  const product = parts.length > 1 ? parts.slice(1).join(' ').trim() : line;

  // Try to find color
  const colorMatch = line.match(/(?:color|finish)[:\s]+(\S[\w\s]+?)(?:[,\-\|]|$)/i);
  const color = colorMatch ? colorMatch[1].trim() : '';

  // Try to find quantity
  const qtyMatch = line.match(/(\d+)\s*(sf|sq\s*ft|sqft|lf|lin\s*ft|pc|pcs|ea|each|units?)/i);
  const quantity = qtyMatch ? `${qtyMatch[1]} ${qtyMatch[2]}` : '';

  return {
    category: catMatch.category,
    product: product.substring(0, 100),
    color: color,
    quantity: quantity,
    notes: ''
  };
}

// ============ HELPERS ============

function extractField(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 200);
    }
  }
  return null;
}

function cleanRoomName(line) {
  return line
    .replace(/[:\-\|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50);
}
