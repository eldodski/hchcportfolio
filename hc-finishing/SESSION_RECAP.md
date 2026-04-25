# HC Finishing (SelectFlow) — Session Recap

**Read this ONE file to catch up on the entire project.**

Last updated: 2026-04-25

---

## What This Is

HC Finishing is an AI-native Finish Intelligence Platform for HCHC. It transforms builder order forms (PDFs) into structured data, lets a designer verify/edit via a Sanity Gate, then generates branded client-ready presentations. Built as vanilla HTML/CSS/JS on the same Supabase + Clerk stack as the HCHC portfolio.

**Project folder:** `C:\Users\Ajdod\OneDrive\Desktop\Claude\Ena\hc-finishing\`

---

## Current Status

**v1.0 Complete — All 3 phases built.** OCR for scanned PDFs in progress.

| Phase | Status | What It Built |
|-------|--------|---------------|
| 1. Finish Intake Engine | Done | PDF upload, text extraction, structured parsing |
| 2. Material Library + Auth + Design Rules | Done | Materials CRUD, Clerk auth, tone/budget compatibility engine |
| 3. Presentation Engine + Sanity Gate | Done | Branded HTML presentations, review/approve workflow |

---

## Supabase Setup (DONE)

- `order_forms` table created via `supabase-intake-setup.sql` — **already run in Supabase SQL Editor**
- Same Supabase project as HCHC: `eqqllaiswgkoxrivgmig.supabase.co`
- Storage buckets still needed: `order-forms` (public), `material-images` (public)

---

## File Inventory

### HTML Pages (root)
| File | What It Does |
|------|-------------|
| `index.html` | Landing page — hero, feature cards, nav |
| `upload.html` | Drag-and-drop PDF upload, parse preview, save to project |
| `review.html` | Sanity Gate — edit parsed data, approve/sign off |
| `materials.html` | Material library CRUD with filters and image upload |
| `dashboard.html` | Stats bar, quick actions, recent order forms |
| `presentation.html` | Generate branded presentation from approved forms |

### JavaScript (js/)
| File | What It Does |
|------|-------------|
| `config.js` | Supabase URL/key, brand colors |
| `supabase-client.js` | CRUD for order_forms table + file upload |
| `pdf-parser.js` | PDF text extraction (pdf.js) + OCR fallback (Tesseract.js) + structured parsing |
| `review-ui.js` | Review page logic — edit, save draft, approve, add/remove rooms/materials |
| `design-rules.js` | Tone harmony + budget variance scoring engine |
| `presentation-template.js` | Generates print-ready branded HTML presentations |
| `clerk-auth.js` | Clerk auth — sign in/up, role detection, nav updates |

### Other
| File | What It Does |
|------|-------------|
| `supabase-intake-setup.sql` | Creates order_forms table, RLS policies, indexes |
| `page1-preview.png` | Screenshot of real PDF page 1 (Whitestone selection sheet) |

---

## Data Flow

```
PDF Upload → pdf.js text extraction
                ↓ (if no text: scanned PDF)
             Tesseract.js OCR (4x scale, grayscale preprocessing)
                ↓
           extractOrderData() → structured JSON
                ↓
           Upload preview (confidence badge, rooms, materials)
                ↓
           Save to Supabase (order_forms table)
                ↓
           Review & Edit (Sanity Gate)
                ↓
           Approve & Sign Off
                ↓
           Generate Presentation (branded HTML, print-ready)
```

---

## The Real PDF Problem (In Progress)

**File:** `C:\Users\Ajdod\Downloads\3310 JONS WAY - SIGNED SELECTIONS.pdf`
- 16-page scanned image PDF from Whitestone Custom Homes
- Buyer: STROUT, Address: 3310 JONS WAY, Subdivision: HARVEST HILLS
- Sections: CABINETS, DOOR/HARDWARE, PAINT, LIGHTING, FIREPLACE
- Zero text layer — requires OCR

### What Was Done
1. Added Tesseract.js v5 CDN to upload.html
2. pdf-parser.js now detects scanned PDFs (word count < 10 instead of char count < 20)
3. Falls back to OCR: renders each page to canvas at **4x scale**
4. Image preprocessing: grayscale conversion + contrast boost + binarization threshold
5. Tesseract PSM mode 6 (uniform text block) + preserve_interword_spaces
6. Progress bar UI with per-page status updates

### Current Issue
OCR quality is still poor on this particular scanned form. The text comes through garbled:
- "MobAddress: — 3stosoNsway" instead of "Lot Address: 3310 JONS WAY"
- "[eSlwr | uowrwe — ]coramaunerscosumez" instead of actual selections
- Some entries partially readable: "Handle High Arc Pulldown", "SINGLEBOWL Colo STANLESSSTEEL"

### Next Steps to Try
1. **Test if 4x + preprocessing improved things** (user hasn't retested yet after latest fix)
2. If still bad: consider **cloud OCR API** (Google Cloud Vision or AWS Textract) — much better for table-structured scanned documents
3. Alternative: accept that OCR will be imperfect and lean on the **Sanity Gate** (human edits the garbled text)
4. Could also try: different Tesseract PSM modes, sharpening filter, or deskewing

---

## Extraction Patterns (pdf-parser.js)

### Builder Info Fields
- Builder: `builder name:`, `builder:`, `contractor:`, `company:`, or `_____ Custom Homes` pattern
- Buyer: `buyer:`, `purchaser:`, `homeowner:`, `owner:`, `client:`
- Project: `project:`, `community:`, `subdivision:`
- Lot: `lot #:`, `lot NN`
- Address: `lot address:`, `address:`, `location:`, or street address regex

### Room/Section Detection
- **Room patterns:** kitchen, bathroom, master bed/suite/bath, living room, dining, bedroom, laundry, etc.
- **Section patterns** (selection sheet format): CABINETS, PAINT, LIGHTING, FIREPLACE, DOOR/HARDWARE, FLOORING, COUNTERTOP, BACKSPLASH, DECO A/B, etc.

### Material Categories
Flooring, Countertops, Cabinetry, Backsplash, Paint, Fixtures, Hardware, Lighting, Mirrors, Window Treatments

---

## Key Fixes Applied During Build

| Issue | Fix |
|-------|-----|
| PDF text extraction joined all items as one line | Y-coordinate grouping: group text items by `item.transform[5]`, sort by X within each line |
| "Builder Order Form" matched as builder name | Reordered regex: try `builder:` (requires colon) before generic pattern |
| Scanned PDF returned "OCR coming soon" error | Added Tesseract.js, OCR fallback when word count < 10 |
| OCR quality poor at 2x scale | Bumped to 4x scale + grayscale/contrast preprocessing |
| Supabase "table not found" error | Ran `supabase-intake-setup.sql` in SQL Editor. Removed FK to nonexistent `projects` table. |
| `python3` not found on Windows | Use `py` command instead |
| UnicodeEncodeError (cp1252) | Set `PYTHONIOENCODING=utf-8` |

---

## Brand System (Applied Across All Pages)

- **Colors:** Navy `#1B2A4A`, Ivory `#F5F0EB`, Espresso `#3C2A21`, Sand `#D4C5B2`, Mocha `#A37762`, Carrara `#E8E4E0`, Gold `#C4A265`
- **Fonts:** Cormorant Garamond (headings), Jost (body)
- **Tagline:** "HC Finishing — SelectFlow"

---

## External Dependencies (CDN)

| Library | Version | URL | Purpose |
|---------|---------|-----|---------|
| pdf.js | 4.0.379 | cdnjs.cloudflare.com | PDF text extraction |
| Tesseract.js | 5.x | cdn.jsdelivr.net | OCR for scanned PDFs |
| Supabase JS | 2.x | cdn.jsdelivr.net | Database + storage |
| Clerk JS | 1.x | cdn.jsdelivr.net | Authentication |
| Google Fonts | — | fonts.googleapis.com | Cormorant Garamond + Jost |

---

## Clerk Auth

- Publishable key: `pk_test_cmFwaWQtbWFja2VyZWwtMjguY2xlcmsuYWNjb3VudHMuZGV2JA`
- Non-blocking: all pages work without auth, auth adds user name + role badge
- Role detection via Clerk metadata

---

## GSD Planning Files (.planning/)

All in `.planning/` directory:
- `PROJECT.md` — project context and vision
- `REQUIREMENTS.md` — 23 v1 requirements across 6 categories
- `ROADMAP.md` — 3-phase roadmap (all complete)
- `STATE.md` — progress tracking (100%)
- `config.json` — workflow preferences
- `01-01-PLAN.md`, `01-01-SUMMARY.md` — Phase 1, Plan 1
- `01-02-PLAN.md`, `01-02-SUMMARY.md` — Phase 1, Plan 2

---

## What To Do Next Session

1. **Retest OCR** — user hasn't tried the 4x scale + preprocessing fix yet
2. **If OCR still bad** — evaluate Google Cloud Vision API as alternative (needs user approval for API key)
3. **Storage buckets** — create `order-forms` and `material-images` in Supabase Dashboard
4. **End-to-end test** — upload real PDF → review → approve → generate presentation
5. **Deploy** — push to GitHub / Vercel when ready for Ena to use
