/**
 * Test the contract parser extraction locally against a PDF.
 * Usage: node scripts/test-parser.js "CHANGE ORDER EXAMPLE.pdf"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const filePath = process.argv[2];
if (!filePath) { console.error('Usage: node scripts/test-parser.js <file>'); process.exit(1); }

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

async function main() {
  const absPath = path.resolve(filePath);
  console.log(`File: ${absPath}`);
  console.log(`Size: ${(fs.statSync(absPath).size / 1024 / 1024).toFixed(2)} MB\n`);

  const fileBuffer = fs.readFileSync(absPath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(absPath).toLowerCase();
  const mimeMap = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  const mimeType = mimeMap[ext] || 'application/pdf';

  // Step 1: Upload to Gemini File API
  console.log('Step 1: Uploading to Gemini File API...');
  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Type': mimeType,
      },
      body: JSON.stringify({ file: { display_name: path.basename(absPath) } }),
    }
  );

  if (!initRes.ok) {
    console.error('Init failed:', await initRes.text());
    process.exit(1);
  }

  const uploadUrl = initRes.headers.get('x-goog-upload-url');
  console.log('  Got upload URL');

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(fileBuffer.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: fileBuffer,
  });

  const uploadData = await uploadRes.json();
  const fileUri = uploadData.file?.uri;
  const fileName = uploadData.file?.name;
  console.log(`  File URI: ${fileUri}`);
  console.log(`  State: ${uploadData.file?.state}`);

  // Step 2: Poll until ACTIVE
  let state = uploadData.file?.state || 'PROCESSING';
  let attempts = 0;
  while (state === 'PROCESSING' && attempts < 20) {
    await new Promise(r => setTimeout(r, 1500));
    const statusRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_KEY}`);
    if (statusRes.ok) {
      const sd = await statusRes.json();
      state = sd.state;
    }
    attempts++;
    process.stdout.write('.');
  }
  console.log(`\n  File state: ${state}`);

  if (state !== 'ACTIVE') {
    console.error('File not ready after polling');
    process.exit(1);
  }

  // Step 3: Call generateContent
  console.log('\nStep 2: Calling generateContent...');
  const genRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: EXTRACTION_PROMPT },
            { file_data: { mime_type: mimeType, file_uri: fileUri } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 65536,
          responseMimeType: 'application/json',
        }
      }),
    }
  );

  const genData = await genRes.json();

  if (!genRes.ok) {
    console.error('generateContent failed:', JSON.stringify(genData, null, 2));
    process.exit(1);
  }

  // Extract response
  const text = genData.candidates?.[0]?.content?.parts?.[0]?.text;
  const finishReason = genData.candidates?.[0]?.finishReason;

  console.log(`  Finish reason: ${finishReason}`);
  console.log(`  Response length: ${text?.length || 0} chars`);

  if (!text) {
    console.error('No text in response:', JSON.stringify(genData, null, 2));
    process.exit(1);
  }

  // Try to parse
  let cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    console.log('\n=== PARSED SUCCESSFULLY ===');
    console.log(JSON.stringify(parsed, null, 2));
    console.log(`\nBuyer fields: ${Object.values(parsed.buyerRecord || {}).filter(v => v && v !== 'not found').length}/7`);
    console.log(`Finish selections: ${(parsed.finishSelections || []).length}`);
  } catch (e) {
    console.error('\n=== JSON PARSE FAILED ===');
    console.error(`Error: ${e.message}`);
    console.error(`First 500 chars: ${cleaned.substring(0, 500)}`);
    console.error(`Last 200 chars: ${cleaned.substring(cleaned.length - 200)}`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
