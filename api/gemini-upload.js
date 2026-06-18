// Vercel Serverless Function — initiates a Gemini File API resumable upload
// OR checks file processing status. Keeps API key server-side.
// Returns the upload URL so the client can upload directly to Google (bypasses Vercel 4.5MB body limit)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { mimeType, fileName, fileSize, checkStatus } = req.body;

  try {
    // Mode 2: Check file processing status
    if (checkStatus) {
      const statusRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${checkStatus}?key=${apiKey}`
      );
      if (!statusRes.ok) {
        return res.status(200).json({ state: 'PROCESSING' });
      }
      const statusData = await statusRes.json();
      return res.status(200).json({ state: statusData.state, uri: statusData.uri });
    }

    // Mode 1: Initiate resumable upload
    if (!mimeType) return res.status(400).json({ error: 'mimeType is required' });

    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': String(fileSize || 0),
          'X-Goog-Upload-Header-Content-Type': mimeType,
        },
        body: JSON.stringify({
          file: { display_name: fileName || 'upload' }
        })
      }
    );

    if (!initRes.ok) {
      const err = await initRes.text();
      return res.status(500).json({ error: 'Gemini File API init failed: ' + err });
    }

    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
      return res.status(500).json({ error: 'No upload URL returned from Gemini' });
    }

    return res.status(200).json({ uploadUrl });
  } catch (err) {
    console.error('gemini-upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
