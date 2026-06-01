# Change Order Parser — Setup Guide

Automated pipeline: file dropped in Google Drive → Gemini parses it → draft project appears in Supabase for the presentation engine.

## Prerequisites

- Google account with access to the HCHC Google Drive
- "HC Finishing Uploads" folder already created in Drive
- Gemini API key (already have: starts with AIza...)
- Supabase service role key (already have: starts with eyJ...)

## Step-by-Step Setup

### 1. Create the Apps Script project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Name it "HCHC Change Order Parser"
4. Delete the placeholder code in `Code.gs`
5. Paste the entire contents of `AppsScript.js` into `Code.gs`
6. Click **Save**

### 2. Enable the Drive API (required for PDF-to-text conversion)

1. In the Apps Script editor, click the **+** next to "Services" in the left sidebar
2. Scroll to **Drive API** (v2), select it, click **Add**

### 3. Set API keys

1. In the Apps Script editor, find the `setScriptProperties_()` function
2. Replace `YOUR_GEMINI_API_KEY_HERE` with the Gemini API key
3. Replace `YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE` with the Supabase service role key
4. Run `setScriptProperties_()` (click the function dropdown at top, select it, click Run)
5. Approve the permission prompts when asked
6. **After it runs successfully**, delete the key values from the function (replace them back with placeholder text for security)

### 4. Create the trigger

1. In the function dropdown, select `setupTrigger`
2. Click **Run**
3. This creates a time-based trigger that checks for new files every 5 minutes

### 5. Test it

1. Upload a change order PDF to the "HC Finishing Uploads" folder in Google Drive
2. Either wait 5 minutes for the trigger, or:
   - In Apps Script, select `testParseFile` from the dropdown
   - Click **Run**
   - Check the execution log for results
3. Go to the HCHC presentation engine — a new draft project should appear

## How It Works

```
HC Finishing Uploads/          ← Drop files here
  ├── some-change-order.pdf    ← Auto-detected by trigger
  └── Processed/               ← Files move here after parsing
        └── some-change-order.pdf
```

1. **Every 5 minutes**, the script checks "HC Finishing Uploads" for new files
2. **PDF/DOCX/images** are converted to text using Google Drive's built-in OCR
3. **Google Sheets** are read cell-by-cell
4. The extracted text is sent to **Gemini 2.0 Flash** with a structured prompt
5. Gemini returns **JSON** with all selections organized by room
6. The JSON is inserted into Supabase's `projects` table as a **draft** project
7. The file is moved to the **Processed** subfolder
8. Ena opens the **presentation engine**, sees the draft, adjusts if needed, generates the presentation

## Supported File Types

- PDF (most common — scanned forms use OCR)
- DOCX / DOC
- XLSX / XLS
- Google Docs
- Google Sheets
- JPG / PNG (photographed forms — uses OCR)

## Troubleshooting

**"Intake folder not found"**
The folder name must be exactly "HC Finishing Uploads" in Google Drive.

**"Very little text extracted"**
The PDF may be a scanned image with poor quality. Try a higher-resolution scan, or photograph the form with good lighting and upload the photo instead.

**"Gemini API error (429)"**
Rate limited. The 5-minute polling interval should prevent this, but if you batch-upload many files at once, some may fail and need to be moved back from Processed to retry.

**"Supabase insert failed"**
Check that the service role key is correct and the `projects` table exists. The key should start with `eyJ` and the table should have a `selections_json` column of type JSONB.

## Files in this directory

- `AppsScript.js` — The complete Apps Script code (paste into script.google.com)
- `schema.json` — JSON schema documenting the parser output format
- `SETUP.md` — This file
