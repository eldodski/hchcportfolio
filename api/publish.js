// Social Post Publishing API
// Publishes posts to Pinterest (and Instagram when Meta approves)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postId, platforms, imageUrl, caption, hashtags, altText, projectType } = req.body || {};

  if (!postId || !platforms || !Array.isArray(platforms)) {
    return res.status(400).json({ error: 'postId and platforms[] required' });
  }

  const results = [];

  for (const platform of platforms) {
    try {
      switch (platform) {
        case 'pinterest':
          results.push(await publishToPinterest({ imageUrl, caption, hashtags, altText, projectType }));
          break;
        case 'instagram':
          results.push({
            platform: 'instagram',
            status: 'pending',
            message: 'Instagram API pending Meta approval. Post manually for now.'
          });
          break;
        case 'facebook':
          results.push({
            platform: 'facebook',
            status: 'pending',
            message: 'Facebook API not connected yet. Post manually for now.'
          });
          break;
        default:
          results.push({ platform, status: 'error', message: `Unknown platform: ${platform}` });
      }
    } catch (err) {
      results.push({ platform, status: 'error', message: err.message });
    }
  }

  const allSuccess = results.every(r => r.status === 'success');
  return res.status(200).json({
    success: allSuccess,
    postId,
    results
  });
}

// ============ PINTEREST ============

async function publishToPinterest({ imageUrl, caption, hashtags, altText, projectType }) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) {
    return { platform: 'pinterest', status: 'error', message: 'Pinterest access token not configured. Add PINTEREST_ACCESS_TOKEN to Vercel env vars.' };
  }

  // Build description with hashtags
  let description = caption || '';
  if (hashtags && hashtags.length > 0) {
    description += '\n\n' + hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ');
  }

  // Get or create the board
  const boardId = await getOrCreateBoard(token, projectType);

  // Create the pin
  const pinResponse = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      board_id: boardId,
      title: caption ? caption.substring(0, 100) : 'Hill Country Home Concepts',
      description: description.substring(0, 500),
      alt_text: altText || caption || 'Interior design by Hill Country Home Concepts',
      media_source: {
        source_type: 'image_url',
        url: imageUrl
      },
      link: 'https://www.hillcountryhomeconcepts.com/social'
    })
  });

  if (!pinResponse.ok) {
    const err = await pinResponse.text();
    return { platform: 'pinterest', status: 'error', message: `Pinterest API error: ${err}` };
  }

  const pin = await pinResponse.json();
  return {
    platform: 'pinterest',
    status: 'success',
    pinId: pin.id,
    message: 'Published to Pinterest'
  };
}

// Map project types to Pinterest board names
const BOARD_MAP = {
  'kitchen': 'Kitchen Design Inspiration',
  'bathroom': 'Bathroom Design Inspiration',
  'flooring': 'Flooring & LVP',
  'tile': 'Tile Work',
  'mood-board': 'Design Mood Boards'
};

async function getOrCreateBoard(token, projectType) {
  const boardName = BOARD_MAP[projectType] || 'Hill Country Home Concepts';

  // List existing boards
  const listRes = await fetch('https://api.pinterest.com/v5/boards', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.items?.find(b =>
      b.name.toLowerCase() === boardName.toLowerCase()
    );
    if (existing) return existing.id;
  }

  // Create new board
  const createRes = await fetch('https://api.pinterest.com/v5/boards', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: boardName,
      description: `Interior design portfolio — ${boardName}`,
      privacy: 'PUBLIC'
    })
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Pinterest board: ${err}`);
  }

  const board = await createRes.json();
  return board.id;
}
