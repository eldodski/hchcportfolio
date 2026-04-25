// HC Finishing — Clerk Auth Integration
// Adapted from HCHC platform clerk-auth.js

let _clerk = null;

async function initClerk() {
  if (_clerk) return _clerk;

  await new Promise((resolve) => {
    if (window.Clerk) { resolve(); return; }
    const check = setInterval(() => {
      if (window.Clerk) { clearInterval(check); resolve(); }
    }, 50);
    setTimeout(() => { clearInterval(check); resolve(); }, 10000);
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

function getUserRole() {
  const user = getUser();
  if (!user) return null;
  return user.publicMetadata?.role || 'designer';
}

function getUserId() {
  const user = getUser();
  return user ? user.id : null;
}

function getUserDisplayName() {
  const user = getUser();
  if (!user) return 'Guest';
  return user.firstName || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
}

async function requireAuth() {
  const clerk = await initClerk();
  if (!clerk || !clerk.user) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

async function signOut() {
  if (!_clerk) return;
  await _clerk.signOut();
  window.location.href = 'index.html';
}

function openSignIn() {
  if (!_clerk) return;
  _clerk.openSignIn({
    afterSignInUrl: 'dashboard.html',
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
    afterSignUpUrl: 'dashboard.html',
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

// Update nav based on auth state
function updateNavAuth() {
  const authNav = document.getElementById('auth-nav');
  if (!authNav) return;

  if (isSignedIn()) {
    const name = getUserDisplayName();
    authNav.innerHTML = `
      <a href="dashboard.html" class="nav-link">Dashboard</a>
      <span class="nav-user">${name}</span>
      <button onclick="signOut()" class="nav-btn">Sign Out</button>
    `;
  } else {
    authNav.innerHTML = `
      <button onclick="openSignIn()" class="nav-btn">Sign In</button>
      <button onclick="openSignUp()" class="nav-btn nav-btn-primary">Get Started</button>
    `;
  }
}
