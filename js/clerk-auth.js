// ============================================================
// HCHC Auth Context Provider
// Clerk (identity) + Supabase (profile/RLS)
// Single source of truth for session, role, tier, status
// ============================================================

const HCHCAuth = (function () {
  'use strict';

  let _clerk = null;
  let _profile = null;       // Supabase user_profiles row
  let _ready = false;
  let _readyCallbacks = [];
  let _changeCallbacks = [];

  // ---- Clerk initialization ----

  async function initClerk() {
    if (_clerk) return _clerk;

    await new Promise((resolve) => {
      if (window.Clerk) { resolve(); return; }
      let timer;
      const check = setInterval(() => {
        if (window.Clerk) { clearInterval(check); clearTimeout(timer); resolve(); }
      }, 50);
      timer = setTimeout(() => { clearInterval(check); resolve(); }, 10000);
    });

    if (!window.Clerk) {
      console.error('Clerk SDK not loaded.');
      return null;
    }

    _clerk = window.Clerk;
    await _clerk.load();

    // Listen for session changes (sign in / sign out)
    _clerk.addListener(async ({ user }) => {
      if (user) {
        await _fetchProfile(user.id);
      } else {
        _profile = null;
      }
      _notifyChange();
    });

    // Initial profile fetch if already signed in
    if (_clerk.user) {
      await _fetchProfile(_clerk.user.id);
    }

    _ready = true;
    _readyCallbacks.forEach(cb => cb());
    _readyCallbacks = [];

    return _clerk;
  }

  // ---- Supabase profile fetch ----

  async function _fetchProfile(clerkUserId) {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!sb) {
      console.warn('Supabase client not available — using Clerk metadata only');
      _profile = _profileFromClerkMetadata();
      return;
    }

    try {
      // Get Clerk session token for Supabase
      const token = await _clerk.session?.getToken({ template: 'supabase' });

      if (token) {
        // Create authenticated Supabase client
        const authSb = window.supabase.createClient(
          HCHC_CONFIG.supabase.url,
          HCHC_CONFIG.supabase.anonKey,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data, error } = await authSb
          .from('user_profiles')
          .select('*')
          .eq('clerk_user_id', clerkUserId)
          .single();

        if (data && !error) {
          _profile = data;
          return;
        }
      }
    } catch (e) {
      console.warn('Profile fetch failed, falling back to Clerk metadata:', e);
    }

    // Fallback: construct profile from Clerk metadata
    _profile = _profileFromClerkMetadata();
  }

  function _profileFromClerkMetadata() {
    const user = _clerk?.user;
    if (!user) return null;
    return {
      clerk_user_id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || '',
      first_name: user.firstName || '',
      last_name: user.lastName || '',
      role: user.publicMetadata?.role || user.unsafeMetadata?.role || 'homeowner',
      tier: user.publicMetadata?.tier || user.unsafeMetadata?.tier || null,
      status: user.publicMetadata?.status || user.unsafeMetadata?.status || 'pending',
      company_name: user.unsafeMetadata?.company_name || null,
    };
  }

  // ---- Public API ----

  function isSignedIn() {
    return !!_clerk?.user;
  }

  function getUser() {
    return _clerk?.user || null;
  }

  function getProfile() {
    return _profile;
  }

  function getRole() {
    return _profile?.role || null;
  }

  function getTier() {
    return _profile?.tier || null;
  }

  function getStatus() {
    return _profile?.status || null;
  }

  function getFirstName() {
    return _profile?.first_name || _clerk?.user?.firstName || '';
  }

  function getFullName() {
    const first = _profile?.first_name || _clerk?.user?.firstName || '';
    const last = _profile?.last_name || _clerk?.user?.lastName || '';
    return `${first} ${last}`.trim();
  }

  function isAdmin() {
    return _profile?.role === 'admin';
  }

  function isActive() {
    return _profile?.status === 'active';
  }

  function isPending() {
    return _profile?.status === 'pending';
  }

  function hasTier(requiredTier) {
    const tierRank = { tier_1: 1, tier_2: 2, tier_3: 3 };
    const userRank = tierRank[_profile?.tier] || 0;
    const reqRank = tierRank[requiredTier] || 0;
    return userRank >= reqRank;
  }

  // ---- Auth state enum ----
  // Returns: 'public' | 'pending' | 'authenticated'
  function getNavState() {
    if (!isSignedIn()) return 'public';
    if (isPending()) return 'pending';
    if (isActive()) return 'authenticated';
    return 'pending'; // suspended or other = treat as pending
  }

  // ---- Sign in / Sign up / Sign out ----

  function openSignIn(returnUrl) {
    if (!_clerk) return;
    _clerk.openSignIn({
      afterSignInUrl: returnUrl || '/dashboard/',
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

  function openSignUp(role, options) {
    if (!_clerk) return;
    const meta = { role: role || 'homeowner' };
    if (options?.companyName) meta.company_name = options.companyName;

    _clerk.openSignUp({
      afterSignUpUrl: '/account/pending.html',
      appearance: {
        variables: {
          colorPrimary: '#1B2A4A',
          colorText: '#3C2A21',
          fontFamily: 'Jost, sans-serif',
          borderRadius: '0px'
        }
      },
      unsafeMetadata: meta
    });
  }

  async function signOut() {
    if (!_clerk) return;
    localStorage.removeItem('hchc_admin_sidebar_state');
    localStorage.removeItem('hchc_view_as_role');
    await _clerk.signOut();
    _profile = null;
    window.location.href = '/';
  }

  // ---- Supabase authenticated client ----
  // Returns a Supabase client with Clerk JWT for RLS
  async function getAuthClient() {
    if (!_clerk?.session) return null;
    try {
      const token = await _clerk.session.getToken({ template: 'supabase' });
      if (!token) return null;
      return window.supabase.createClient(
        HCHC_CONFIG.supabase.url,
        HCHC_CONFIG.supabase.anonKey,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
    } catch (e) {
      console.error('Failed to get auth Supabase client:', e);
      return null;
    }
  }

  // ---- View As (admin overlay) ----

  function getViewAsRole() {
    if (!isAdmin()) return null;
    return localStorage.getItem('hchc_view_as_role') || null;
  }

  function setViewAs(role) {
    if (!isAdmin()) return;
    if (role) {
      localStorage.setItem('hchc_view_as_role', role);
    } else {
      localStorage.removeItem('hchc_view_as_role');
    }
    _notifyChange();
  }

  // Returns the effective role (view-as override or actual)
  function getEffectiveRole() {
    return getViewAsRole() || getRole();
  }

  // ---- Event system ----

  function onReady(callback) {
    if (_ready) { callback(); return; }
    _readyCallbacks.push(callback);
  }

  function onChange(callback) {
    _changeCallbacks.push(callback);
  }

  function _notifyChange() {
    _changeCallbacks.forEach(cb => cb());
  }

  // ---- Auto-init ----
  // Call this at the bottom of every page
  async function init() {
    await initClerk();
  }

  return {
    init,
    onReady,
    onChange,
    isSignedIn,
    getUser,
    getProfile,
    getRole,
    getTier,
    getStatus,
    getFirstName,
    getFullName,
    isAdmin,
    isActive,
    isPending,
    hasTier,
    getNavState,
    openSignIn,
    openSignUp,
    signOut,
    getAuthClient,
    getViewAsRole,
    setViewAs,
    getEffectiveRole,
  };
})();
