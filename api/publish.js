// Social Post Publishing Stub
// Phase 1: No-op — returns success message
// Phase 2: Wire Meta Graph API, Pinterest API

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postId, platforms } = req.body || {};

  if (!postId || !platforms || !Array.isArray(platforms)) {
    return res.status(400).json({ error: 'postId and platforms[] required' });
  }

  // Stub response — no actual publishing yet
  return res.status(200).json({
    success: true,
    message: 'Publishing stub — no platforms connected yet. Copy your post to each platform manually.',
    postId,
    platforms,
    results: platforms.map(p => ({
      platform: p,
      status: 'stub',
      message: `${p} API not connected. Manual post required.`
    }))
  });
}
