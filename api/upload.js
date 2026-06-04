// Storage Upload API — proxies uploads through service role key to bypass RLS
// Used by social queue image uploads and any other client-side storage uploads
// Requires SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL env vars in Vercel

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || 'https://eqqllaiswgkoxrivgmig.supabase.co';

  if (!serviceKey) {
    return res.status(500).json({ error: 'Server configuration error: missing service role key' });
  }

  const { bucket, filename, contentType, fileBase64 } = req.body || {};

  if (!bucket || !filename || !fileBase64) {
    return res.status(400).json({ error: 'bucket, filename, and fileBase64 are required' });
  }

  // Only allow known buckets
  const allowedBuckets = ['social-images', 'material-images', 'uploads', 'presentations', 'order-forms'];
  if (!allowedBuckets.includes(bucket)) {
    return res.status(400).json({ error: `Bucket "${bucket}" is not allowed` });
  }

  try {
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': contentType || 'application/octet-stream',
          'Cache-Control': '3600',
        },
        body: fileBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error('Storage upload error:', errBody);
      return res.status(uploadRes.status).json({ error: errBody || 'Upload failed' });
    }

    // Build public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;

    return res.status(200).json({
      url: publicUrl,
      path: filename,
      bucket,
    });
  } catch (err) {
    console.error('Upload handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
