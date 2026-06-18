// Vercel Serverless Function — uploads file to Gemini File API, then calls generateContent
// Solves the Vercel 4.5MB body limit by using Gemini's File API (resumable upload)
// Client sends base64 file + prompt → this function uploads to Gemini → returns AI response

export const config = {
  maxDuration: 120,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { fileBase64, mimeType, fileName, prompt, model, generationConfig } = req.body;

  if (!fileBase64 || !mimeType) {
    return res.status(400).json({ error: 'fileBase64 and mimeType are required' });
  }

  const useModel = model || 'gemini-2.5-flash';

  try {
    // Step 1: Initiate resumable upload to Gemini File API
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Type': mimeType,
        },
        body: JSON.stringify({
          file: { display_name: fileName || 'upload' }
        })
      }
    );

    if (!initRes.ok) {
      const err = await initRes.text();
      return res.status(500).json({ error: 'File API init failed: ' + err });
    }

    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
      return res.status(500).json({ error: 'No upload URL returned from Gemini File API' });
    }

    // Step 2: Upload file bytes
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': String(fileBuffer.length),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: 'File upload failed: ' + err });
    }

    const uploadData = await uploadRes.json();
    const fileUri = uploadData.file?.uri;
    if (!fileUri) {
      return res.status(500).json({ error: 'No file URI in upload response', raw: uploadData });
    }

    // Step 3: Wait for file processing (poll until ACTIVE)
    let fileState = uploadData.file?.state || 'PROCESSING';
    let fileName2 = uploadData.file?.name;
    let attempts = 0;
    while (fileState === 'PROCESSING' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName2}?key=${apiKey}`
      );
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        fileState = statusData.state;
      }
      attempts++;
    }

    if (fileState !== 'ACTIVE') {
      return res.status(500).json({ error: 'File processing timed out or failed, state: ' + fileState });
    }

    // Step 4: Call generateContent with file reference
    const contents = [{
      parts: [
        { text: prompt || 'Analyze this document.' },
        { file_data: { mime_type: mimeType, file_uri: fileUri } }
      ]
    }];

    const genRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: generationConfig || { temperature: 0.1, maxOutputTokens: 16384 }
        })
      }
    );

    const genData = await genRes.json();

    if (!genRes.ok) {
      return res.status(genRes.status).json(genData);
    }

    return res.status(200).json(genData);

  } catch (err) {
    console.error('gemini-file error:', err);
    return res.status(500).json({ error: err.message });
  }
}
