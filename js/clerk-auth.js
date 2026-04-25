// Clerk Auth Integration for HCHC Platform
// Handles sign-in/sign-up, session management, and role-based access

let _clerk = null;

async function initClerk() {
  if (_clerk) return _clerk;

  // Wait for Clerk to load
  await new Promise((resolve) => {
    if (window.Clerk) { resolve(); return; }
    let timer;
    const check = setInterval(() => {
      if (window.Clerk) { clearInterval(check); clearTimeout(timer); resolve(); }
    }, 50);
    // Timeout after 10s
    timer = setTimeout(() => { clearInterval(check); resolve(); }, 10000);
  });

  if (!window.Clerk) {
    console.error('Clerk SDK not loaded.');
    return null;
  }

  _clerk = window.Clerk;
  await _clerk.load();
  return _clerk;
}

function getUser() {
  if (!_clerk) return null;
  return _clerk.user;
}

function isSignedIn() {
  if (!_clerk) return false;
  return !!_clerk.user;
}

// TODO [PRODUCTION SECURITY]: User roles are currently set via unsafeMetadata
// during sign-up (see openSignUp below). unsafeMetadata is client-writable,
// meaning any user could change their own role via browser devtools.
//
// For production, roles MUST be set via Clerk Backend API or a Clerk webhook
// that writes to publicMetadata (which is read-only on the client). The
// fallback chain below (publicMetadata -> unsafeMetadata -> default) is
// structured so that once publicMetadata.role is set server-side, it takes
// precedence. This is safe for development but must be hardened before launch.
function getUserRole() {
  const user = getUser();
  if (!user) return null;
  return user.publicMetadata?.role || user.unsafeMetadata?.role || 'home_purchaser';
}

function getUserId() {
  const user = getUser();
  return user ? user.id : null;
}

// Mount Clerk sign-in button to an element
function mountSignInButton(elementId) {
  if (!_clerk) return;
  const el = document.getElementById(elementId);
  if (!el) return;
  _clerk.mountSignIn(el);
}

// Redirect to sign-in if not authenticated
async function requireAuth() {
  const clerk = await initClerk();
  if (!clerk || !clerk.user) {
    window.location.href = '/';
    return false;
  }
  return true;
}

// Sign out and redirect home
async function signOut() {
  if (!_clerk) return;
  await _clerk.signOut();
  window.location.href = '/';
}

// Update nav based on auth state
function updateNavAuth() {
  const authNav = document.getElementById('auth-nav');
  if (!authNav) return;

  if (isSignedIn()) {
    const user = getUser();
    const name = user.firstName || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
    authNav.innerHTML = `
      <a href="/dashboard/" class="nav-auth-link">Dashboard</a>
      <span class="nav-user-name">${name}</span>
      <button onclick="signOut()" class="nav-auth-btn">Sign Out</button>
    `;
  } else {
    authNav.innerHTML = `
      <button onclick="openSignIn()" class="nav-auth-btn">Sign In</button>
      <button onclick="openSignUp()" class="btn nav-signup-btn">Get Started</button>
    `;
  }
}

function openSignIn() {
  if (!_clerk) return;
  _clerk.openSignIn({
    afterSignInUrl: '/dashboard/',
    appearance: {
      variables: {
        colorPrimary: '#1B2A4A',
        colorText: '#3C2A21',
        fontFamily: 'Jost, sans-serif',
        borderRadius: '0px'
      }
    }
  });
}

function openSignUp() {
  if (!_clerk) return;
  _clerk.openSignUp({
    afterSignUpUrl: '/dashboard/',
    appearance: {
      variables: {
        colorPrimary: '#1B2A4A',
        colorText: '#3C2A21',
        fontFamily: 'Jost, sans-serif',
        borderRadius: '0px'
      }
    },
    unsafeMetadata: {
      role: 'builder' // TODO [PRODUCTION]: Move to server-side publicMetadata (see getUserRole comment)
    }
  });
}
