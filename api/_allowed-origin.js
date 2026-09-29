// Shared check so only the HCHC website can call these API endpoints.
// Files that start with an underscore are not published as endpoints by Vercel.

const ALLOWED_HOSTS = [
  'hillcountryhomeconcepts.com',
  'www.hillcountryhomeconcepts.com',
  'hchcportfolio.vercel.app',
  'localhost',
  '127.0.0.1',
];

function hostOf(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

function isAllowedHost(host) {
  if (!host) return false;
  if (ALLOWED_HOSTS.includes(host)) return true;
  // Vercel preview deployments of this project
  return /^hchcportfolio-[a-z0-9-]+\.vercel\.app$/.test(host);
}

// Returns true when the request came from the HCHC site.
// Otherwise sends a 403 response and returns false.
export function checkOrigin(req, res, allowHeaders = 'Content-Type') {
  const origin = req.headers.origin;
  const host = hostOf(origin) || hostOf(req.headers.referer);

  if (!isAllowedHost(host)) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', allowHeaders);
  }
  return true;
}
