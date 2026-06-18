// Vercel Serverless Function — calls Gemini generateContent with a file URI
// Companion to /api/gemini-upload: client uploads file directly to Gemini,
// then sends the file URI here for AI processing.

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

  const { fileUri, mimeType, prompt, model, generationConfig } = req.body;
  if (!fileUri) return res.status(400).json({ error: 'fileUri is required' });

  const useModel = model || 'gemini-2.5-flash';

  try {
    const contents = [{
      parts: [
        { text: prompt || 'Analyze this document.' },
        { file_data: { mime_type: mimeType || 'application/pdf', file_uri: fileUri } }
      ]
    }];

    const genRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: generationConfig || {
            temperature: 0.1,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const genData = await genRes.json();

    if (!genRes.ok) {
      return res.status(genRes.status).json(genData);
    }

    return res.status(200).json(genData);
  } catch (err) {
    console.error('gemini-generate error:', err);
    return res.status(500).json({ error: err.message });
  }
}
