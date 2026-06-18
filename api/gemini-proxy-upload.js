// Vercel Serverless Function — proxies raw file bytes to a Gemini upload URL
// Receives raw binary body + upload URL in header, forwards to Gemini.
// This avoids CORS issues (browser can't POST directly to Google)
// and avoids base64 inflation (raw bytes = 33% smaller than base64).

export const config = {
  api: {
    bodyParser: false, // receive raw bytes, don't parse as JSON
  },
};

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Upload-Url');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const uploadUrl = req.headers['x-upload-url'];
  if (!uploadUrl) {
    return res.status(400).json({ error: 'X-Upload-Url header is required' });
  }

  // Validate the upload URL points to Google
  if (!uploadUrl.includes('googleapis.com')) {
    return res.status(400).json({ error: 'Invalid upload URL' });
  }

  try {
    const body = await collectBody(req);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': String(body.length),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: body,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: 'Gemini upload failed: ' + err });
    }

    const data = await uploadRes.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('gemini-proxy-upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
