/**
 * HCHC Change Order Parser — Google Apps Script
 *
 * Auto-triggers when a file is uploaded to the HCHC_Change_Orders folder in Google Drive.
 * Sends the document to Gemini for universal parsing, then creates a draft project in Supabase.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to script.google.com and create a new project
 * 2. Paste this entire file into Code.gs
 * 3. Run setupTrigger() once to create the time-based polling trigger
 * 4. Set script properties (see setScriptProperties_ below) then run it once
 * 5. The folder "HC Finishing Uploads" should already exist in the HCHC Google Drive
 * 6. A "Processed" subfolder will be auto-created on first run
 * 7. Done — drop files into HC Finishing Uploads and they auto-parse
 */

// ============ CONFIGURATION ============

function getConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    GEMINI_API_KEY: props.getProperty('GEMINI_API_KEY'),
    SUPABASE_URL: props.getProperty('SUPABASE_URL'),
    SUPABASE_SERVICE_KEY: props.getProperty('SUPABASE_SERVICE_KEY'),
    INTAKE_FOLDER_NAME: 'HC Finishing Uploads',
    PROCESSED_FOLDER_NAME: 'Processed'
  };
}

/**
 * Run this ONCE to store your API keys as script properties.
 * After running, delete the key values from this function for security.
 */
function setScriptProperties_() {
  PropertiesService.getScriptProperties().setProperties({
    'GEMINI_API_KEY': 'YOUR_GEMINI_API_KEY_HERE',
    'SUPABASE_URL': 'https://eqqllaiswgkoxrivgmig.supabase.co',
    'SUPABASE_SERVICE_KEY': 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE'
  });
  Logger.log('Script properties set. Now delete the key values from this function.');
}

// ============ TRIGGER SETUP ============

/**
 * Run this ONCE to create a time-based trigger that checks for new files every 5 minutes.
 * Google Apps Script does not support true Drive event triggers for arbitrary folders,
 * so we poll on a short interval instead.
 */
function setupTrigger() {
  // Remove any existing triggers first
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'processNewFiles') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('processNewFiles')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Trigger created: processNewFiles runs every 5 minutes.');
}

// ============ MAIN PIPELINE ============

/**
 * Main entry point — called by the time trigger.
 * Finds new files in the intake folder, processes each one, moves to Processed.
 */
function processNewFiles() {
  var config = getConfig_();
  var folders = DriveApp.getFoldersByName(config.INTAKE_FOLDER_NAME);

  if (!folders.hasNext()) {
    Logger.log('Intake folder not found: ' + config.INTAKE_FOLDER_NAME);
    return;
  }

  var intakeFolder = folders.next();
  var processedFolder = getOrCreateSubfolder_(intakeFolder, config.PROCESSED_FOLDER_NAME);
  var files = intakeFolder.getFiles();
  var processedCount = 0;

  while (files.hasNext()) {
    var file = files.next();
    var mimeType = file.getMimeType();
    var fileName = file.getName();

    // Skip non-document files
    if (!isSupportedFile_(mimeType, fileName)) {
      Logger.log('Skipping unsupported file: ' + fileName + ' (' + mimeType + ')');
      continue;
    }

    Logger.log('Processing: ' + fileName);

    try {
      // Step 1: Extract text content from the file
      var content = extractFileContent_(file, mimeType);

      if (!content || content.trim().length < 50) {
        Logger.log('WARNING: Very little text extracted from ' + fileName + '. Skipping.');
        moveFile_(file, processedFolder);
        continue;
      }

      // Step 2: Send to Gemini for parsing
      var parsed = parseWithGemini_(content, fileName, config.GEMINI_API_KEY);

      if (!parsed) {
        Logger.log('ERROR: Gemini parsing failed for ' + fileName);
        moveFile_(file, processedFolder);
        continue;
      }

      // Step 3: Create draft project in Supabase
      var projectId = createDraftProject_(parsed, fileName, config);

      Logger.log('SUCCESS: Created draft project ' + projectId + ' from ' + fileName);
      processedCount++;

    } catch (e) {
      Logger.log('ERROR processing ' + fileName + ': ' + e.message);
    }

    // Move file to Processed regardless of outcome
    moveFile_(file, processedFolder);
  }

  if (processedCount > 0) {
    Logger.log('Processed ' + processedCount + ' change order(s).');
  }
}

// ============ FILE HANDLING ============

function isSupportedFile_(mimeType, fileName) {
  var supported = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'image/jpeg',
    'image/png'
  ];

  // Also support by extension
  var ext = fileName.split('.').pop().toLowerCase();
  var supportedExt = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'jpg', 'jpeg', 'png'];

  return supported.indexOf(mimeType) !== -1 || supportedExt.indexOf(ext) !== -1;
}

/**
 * Extract text content from a file.
 * For PDFs: convert to Google Doc via Drive API (uses OCR), then extract text.
 * For DOCX: convert to Google Doc, then extract text.
 * For images: convert to Google Doc with OCR.
 * For Google Docs/Sheets: read directly.
 */
function extractFileContent_(file, mimeType) {
  // Google Docs — read directly
  if (mimeType === 'application/vnd.google-apps.document') {
    var doc = DocumentApp.openById(file.getId());
    return doc.getBody().getText();
  }

  // Google Sheets — read cell values
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    return extractSheetText_(file.getId());
  }

  // Everything else (PDF, DOCX, images) — convert to Google Doc via Drive API with OCR
  var blob = file.getBlob();
  var resource = {
    title: file.getName() + ' [HCHC Parser Temp]',
    mimeType: 'application/vnd.google-apps.document'
  };

  var options = {
    ocr: true,
    ocrLanguage: 'en'
  };

  // Use Drive API v2 to insert with conversion
  var tempFile = Drive.Files.insert(resource, blob, { ocr: true, convert: true });
  var tempDoc = DocumentApp.openById(tempFile.id);
  var text = tempDoc.getBody().getText();

  // Clean up temp file
  DriveApp.getFileById(tempFile.id).setTrashed(true);

  return text;
}

function extractSheetText_(fileId) {
  var ss = SpreadsheetApp.openById(fileId);
  var sheets = ss.getSheets();
  var allText = [];

  sheets.forEach(function(sheet) {
    var data = sheet.getDataRange().getValues();
    data.forEach(function(row) {
      var rowText = row.map(function(cell) { return String(cell); }).join(' | ');
      if (rowText.replace(/\|/g, '').trim()) {
        allText.push(rowText);
      }
    });
    allText.push('---');
  });

  return allText.join('\n');
}

// ============ GEMINI PARSING ============

function parseWithGemini_(documentText, fileName, apiKey) {
  var prompt = buildParserPrompt_(documentText, fileName);

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

  var payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var status = response.getResponseCode();

  if (status !== 200) {
    Logger.log('Gemini API error (' + status + '): ' + response.getContentText().substring(0, 500));
    return null;
  }

  var result = JSON.parse(response.getContentText());

  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
    Logger.log('Gemini returned no candidates');
    return null;
  }

  var jsonText = result.candidates[0].content.parts[0].text;

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    Logger.log('Failed to parse Gemini JSON output: ' + e.message);
    Logger.log('Raw output: ' + jsonText.substring(0, 1000));
    return null;
  }
}

function buildParserPrompt_(documentText, fileName) {
  return `You are a construction document parser for an interior design platform. Extract ALL material selections, finishes, and specifications from this change order / selection sheet into structured JSON.

RULES:
- Extract every product, material, finish, color, and specification mentioned
- Group selections by room (Kitchen, Master Bath, Bath 2, etc.)
- If a selection applies to the whole home (like paint or lighting package), use room type "whole_home"
- If a room is not explicitly named, infer it from context (e.g. "Kitchen C-Top" = Kitchen countertops)
- Include model numbers when present
- Include grout colors, installation directions, edge profiles, pad types — every detail matters
- For change order line items, extract item number, location, description, model number, quantity, and pricing
- If anything is crossed out, struck through, or marked as replaced, note the REPLACEMENT value, not the original
- If anything is ambiguous, illegible, or conflicting, add it to the "flags" array with a description of the issue
- Return valid JSON only, no markdown, no explanation

FILE NAME: ${fileName}

DOCUMENT TEXT:
${documentText}

Return JSON matching this structure:
{
  "project": {
    "builder_name": "string or null",
    "client_name": "string or null",
    "address": "string or null",
    "subdivision": "string or null",
    "lot": "string or null",
    "plan_name": "string or null",
    "date": "string or null"
  },
  "rooms": [
    {
      "label": "Kitchen",
      "type": "kitchen",
      "paint": { "vendor": null, "color": null, "code": null, "application": "walls", "installNotes": "" },
      "flooring": [{ "vendor": null, "series": null, "color": null, "materialType": "LVP", "direction": null, "pad": null, "installNotes": "" }],
      "cabinetry": { "vendor": null, "wood": null, "door_style": null, "finish": null, "installNotes": "" },
      "countertops": { "vendor": null, "material": null, "color": null, "edge": null, "installNotes": "" },
      "backsplash": { "vendor": null, "series": null, "color": null, "size": null, "grout_color": null, "pattern": null, "installNotes": "" },
      "tile": [{ "vendor": null, "series": null, "color": null, "size": null, "application": "shower wall", "grout_color": null, "pattern": null, "installNotes": "" }],
      "hardware": { "vendor": null, "series": null, "color": null, "installNotes": "" },
      "plumbing": [{ "vendor": null, "fixture_type": "faucet", "series": null, "color": null, "model_number": null, "installNotes": "" }],
      "lighting": { "vendor": null, "series": null, "finish": null, "package_level": null, "installNotes": "" },
      "fireplace": { "style": null, "material": null, "cut": null, "grout_mortar": null, "mantel": null, "installNotes": "" },
      "doors": { "style": null, "hardware_style": null, "hardware_finish": null, "installNotes": "" }
    }
  ],
  "change_orders": [
    { "item_number": null, "location": null, "description": "string", "model_number": null, "quantity": null, "unit_price": null, "total_price": null }
  ],
  "flags": [
    { "field": "Master Bath tile", "issue": "Two different grout colors listed, unclear which applies" }
  ]
}

Only include categories that have data. Omit empty/null categories from each room. Always include the rooms and project objects.`;
}

// ============ SUPABASE ============

function createDraftProject_(parsed, fileName, config) {
  // Build selections_json in the format the presentation engine expects
  var selectionsJson = {
    rooms: buildRoomsForEngine_(parsed.rooms || []),
    change_orders: parsed.change_orders || [],
    flags: parsed.flags || [],
    source_file: fileName,
    parsed_at: new Date().toISOString()
  };

  var projectData = {
    name: buildProjectName_(parsed),
    client_name: parsed.project ? parsed.project.client_name : null,
    builder_name: parsed.project ? parsed.project.builder_name : null,
    address: parsed.project ? parsed.project.address : null,
    status: 'draft',
    selections_json: selectionsJson
  };

  var url = config.SUPABASE_URL + '/rest/v1/projects';

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': config.SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + config.SUPABASE_SERVICE_KEY,
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(projectData),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var status = response.getResponseCode();

  if (status !== 201 && status !== 200) {
    throw new Error('Supabase insert failed (' + status + '): ' + response.getContentText().substring(0, 500));
  }

  var result = JSON.parse(response.getContentText());
  return Array.isArray(result) ? result[0].id : result.id;
}

/**
 * Transform Gemini's parsed rooms into the presentation engine's selections_json.rooms format.
 * The engine expects: { id, type, label, paint: { color, vendor, installNotes }, flooring: [...], etc. }
 * Gemini's output is close but needs room IDs and slight restructuring.
 */
function buildRoomsForEngine_(parsedRooms) {
  return parsedRooms.map(function(room, index) {
    var engineRoom = {
      id: 'room-' + index,
      type: room.type || 'other',
      label: room.label || ('Room ' + (index + 1)),
      collapsed: false
    };

    // Paint — flatten to engine format
    if (room.paint) {
      engineRoom.paint = {
        vendor: room.paint.vendor || '',
        color: room.paint.color || '',
        series: room.paint.code || '',
        installNotes: room.paint.installNotes || (room.paint.application ? 'Application: ' + room.paint.application : '')
      };
    }

    // Flooring — already an array, just normalize
    if (room.flooring && room.flooring.length > 0) {
      engineRoom.flooring = room.flooring.map(function(f) {
        return {
          vendor: f.vendor || '',
          series: f.series || '',
          color: f.color || '',
          materialType: f.materialType || '',
          installNotes: [
            f.direction ? 'Direction: ' + f.direction : '',
            f.pad ? 'Pad: ' + f.pad : '',
            f.installNotes || ''
          ].filter(Boolean).join('. ')
        };
      });
    }

    // Cabinetry
    if (room.cabinetry) {
      engineRoom.cabinetry = {
        vendor: room.cabinetry.vendor || '',
        color: room.cabinetry.finish || '',
        series: room.cabinetry.door_style || '',
        installNotes: room.cabinetry.wood ? 'Wood: ' + room.cabinetry.wood + '. ' + (room.cabinetry.installNotes || '') : (room.cabinetry.installNotes || '')
      };
    }

    // Countertops
    if (room.countertops) {
      engineRoom.countertops = {
        vendor: room.countertops.vendor || '',
        color: room.countertops.color || '',
        series: room.countertops.material || '',
        installNotes: room.countertops.edge ? 'Edge: ' + room.countertops.edge + '. ' + (room.countertops.installNotes || '') : (room.countertops.installNotes || '')
      };
    }

    // Backsplash
    if (room.backsplash) {
      engineRoom.backsplash = {
        vendor: room.backsplash.vendor || '',
        color: room.backsplash.color || '',
        series: room.backsplash.series || '',
        installNotes: [
          room.backsplash.size ? 'Size: ' + room.backsplash.size : '',
          room.backsplash.grout_color ? 'Grout: ' + room.backsplash.grout_color : '',
          room.backsplash.pattern ? 'Pattern: ' + room.backsplash.pattern : '',
          room.backsplash.installNotes || ''
        ].filter(Boolean).join('. ')
      };
    }

    // Hardware
    if (room.hardware) {
      engineRoom.hardware = {
        vendor: room.hardware.vendor || '',
        color: room.hardware.color || '',
        series: room.hardware.series || '',
        installNotes: room.hardware.installNotes || ''
      };
    }

    // Tile — store as array in installNotes since engine has backsplash but not generic tile
    if (room.tile && room.tile.length > 0) {
      engineRoom.tile = room.tile.map(function(t) {
        return {
          vendor: t.vendor || '',
          series: t.series || '',
          color: t.color || '',
          application: t.application || '',
          installNotes: [
            t.size ? 'Size: ' + t.size : '',
            t.grout_color ? 'Grout: ' + t.grout_color : '',
            t.pattern ? 'Pattern: ' + t.pattern : '',
            t.installNotes || ''
          ].filter(Boolean).join('. ')
        };
      });
    }

    // Plumbing — store as array
    if (room.plumbing && room.plumbing.length > 0) {
      engineRoom.plumbing = room.plumbing.map(function(p) {
        return {
          vendor: p.vendor || '',
          fixture_type: p.fixture_type || '',
          series: p.series || '',
          color: p.color || '',
          model_number: p.model_number || '',
          installNotes: p.installNotes || ''
        };
      });
    }

    // Lighting
    if (room.lighting) {
      engineRoom.lighting = {
        vendor: room.lighting.vendor || '',
        series: room.lighting.series || '',
        color: room.lighting.finish || '',
        installNotes: room.lighting.package_level ? 'Package: ' + room.lighting.package_level + '. ' + (room.lighting.installNotes || '') : (room.lighting.installNotes || '')
      };
    }

    // Fireplace
    if (room.fireplace) {
      engineRoom.fireplace = {
        material: room.fireplace.material || '',
        style: room.fireplace.style || '',
        installNotes: [
          room.fireplace.cut ? 'Cut: ' + room.fireplace.cut : '',
          room.fireplace.grout_mortar ? 'Mortar: ' + room.fireplace.grout_mortar : '',
          room.fireplace.mantel ? 'Mantel: ' + room.fireplace.mantel : '',
          room.fireplace.installNotes || ''
        ].filter(Boolean).join('. ')
      };
    }

    // Doors
    if (room.doors) {
      engineRoom.doors = {
        style: room.doors.style || '',
        hardware_style: room.doors.hardware_style || '',
        hardware_finish: room.doors.hardware_finish || '',
        installNotes: room.doors.installNotes || ''
      };
    }

    return engineRoom;
  });
}

function buildProjectName_(parsed) {
  var parts = [];
  if (parsed.project) {
    if (parsed.project.client_name) parts.push(parsed.project.client_name);
    if (parsed.project.address) parts.push(parsed.project.address);
    if (parsed.project.subdivision) parts.push(parsed.project.subdivision);
  }
  return parts.length > 0 ? parts.join(' — ') : 'Parsed Change Order';
}

// ============ HELPERS ============

function getOrCreateSubfolder_(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(name);
}

function moveFile_(file, destFolder) {
  destFolder.addFile(file);
  var parents = file.getParents();
  while (parents.hasNext()) {
    var parent = parents.next();
    if (parent.getId() !== destFolder.getId()) {
      parent.removeFile(file);
    }
  }
}

// ============ MANUAL TEST ============

/**
 * Run this manually to test the pipeline on a specific file.
 * Set the file name below to match a file in your HCHC_Change_Orders folder.
 */
function testParseFile() {
  var config = getConfig_();
  var folders = DriveApp.getFoldersByName(config.INTAKE_FOLDER_NAME);
  if (!folders.hasNext()) {
    Logger.log('Intake folder not found');
    return;
  }

  var folder = folders.next();
  var files = folder.getFilesByName('CHANGE ORDER EXAMPLE.pdf'); // <-- change this
  if (!files.hasNext()) {
    Logger.log('Test file not found');
    return;
  }

  var file = files.next();
  var content = extractFileContent_(file, file.getMimeType());
  Logger.log('Extracted ' + content.length + ' characters');
  Logger.log('First 500 chars: ' + content.substring(0, 500));

  var parsed = parseWithGemini_(content, file.getName(), config.GEMINI_API_KEY);
  Logger.log('Parsed result: ' + JSON.stringify(parsed, null, 2).substring(0, 3000));

  if (parsed) {
    var projectId = createDraftProject_(parsed, file.getName(), config);
    Logger.log('Created draft project: ' + projectId);
  }
}
