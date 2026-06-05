// Storage Upload API — proxies uploads through service role key to bypass RLS
// Also syncs files to Google Drive (Ena's workspace)
//
// Required Vercel env vars:
//   SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
//   GOOGLE_SERVICE_ACCOUNT_KEY (full JSON string of service account key)
//   GOOGLE_DRIVE_FOLDER_ID (shared folder ID for uploads)

import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

// ============ GOOGLE DRIVE AUTH ============

async function getGoogleAccessToken(serviceAccountKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: serviceAccountKey.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${encode(header)}.${encode(payload)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(serviceAccountKey.private_key, 'base64url');

  const jwt = `${unsigned}.${signature}`;

  const tokenRes = await fetch(serviceAccountKey.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// ============ GOOGLE DRIVE UPLOAD ============

// Map bucket names to Drive subfolder names
const DRIVE_SUBFOLDER_MAP = {
  'social-images': 'Social Media Images',
  'order-forms': 'Order Forms',
  'material-images': 'Material Images',
  'presentations': 'Presentations',
  'uploads': 'Uploads',
};

async function uploadToGoogleDrive(accessToken, parentFolderId, filename, fileBuffer, mimeType, bucketName) {
  // Find or create subfolder based on bucket
  const subfolderName = DRIVE_SUBFOLDER_MAP[bucketName] || 'Other';
  let targetFolderId = parentFolderId;

  // Search for existing subfolder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${subfolderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      targetFolderId = searchData.files[0].id;
    } else {
      // Create subfolder
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subfolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }),
      });
      if (createRes.ok) {
        const folder = await createRes.json();
        targetFolderId = folder.id;
      }
    }
  }

  // Upload file using multipart upload
  const metadata = JSON.stringify({
    name: filename,
    parents: [targetFolderId],
  });

  const boundary = '---hchc-upload-boundary---';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    ),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Google Drive upload failed: ${err}`);
  }

  return uploadRes.json();
}

// ============ MAIN HANDLER ============

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

    // 1. Upload to Supabase Storage
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

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;

    // 2. Sync to Google Drive (non-blocking — don't fail the request if Drive sync fails)
    let driveResult = null;
    const gServiceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (gServiceKey && driveFolderId) {
      try {
        const sa = JSON.parse(gServiceKey);
        const accessToken = await getGoogleAccessToken(sa);
        driveResult = await uploadToGoogleDrive(
          accessToken,
          driveFolderId,
          filename,
          fileBuffer,
          contentType || 'application/octet-stream',
          bucket
        );
        console.log('Google Drive sync:', driveResult?.id);
      } catch (driveErr) {
        console.error('Google Drive sync failed (non-fatal):', driveErr.message);
        driveResult = { error: driveErr.message };
      }
    }

    return res.status(200).json({
      url: publicUrl,
      path: filename,
      bucket,
      drive: driveResult,
    });
  } catch (err) {
    console.error('Upload handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
