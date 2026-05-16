// ============================================================
// HCHC Route Guard System
// Protects pages based on auth state, role, tier, and status
// Include on every protected page AFTER clerk-auth.js
// ============================================================

const HCHCRouteGuard = (function () {
  'use strict';

  // Route protection configuration
  // Each key is a path prefix, value defines requirements
  const ROUTE_RULES = {
    '/admin/': { requireAuth: true, requireActive: true, requireRole: ['admin'] },
    '/dashboard/designer/': { requireAuth: true, requireActive: true, requireRole: ['interior_designer'] },
    '/dashboard/builder/': { requireAuth: true, requireActive: true, requireRole: ['builder'] },
    '/dashboard/homeowner/': { requireAuth: true, requireActive: true, requireRole: ['homeowner'] },
    '/dashboard/social-queue': { requireAuth: true, requireActive: true, requireRole: ['admin'] },
    '/dashboard/': { requireAuth: true, requireActive: true },
    '/dashboard.html': { requireAuth: true, requireActive: true },
    '/presentation-engine': { requireAuth: true, requireActive: true, requireRole: ['interior_designer', 'builder', 'admin'], requireTier: 'tier_2' },
    '/account/pending': { requireAuth: true },
    '/account/settings': { requireAuth: true },
    '/materials.html': { requireAuth: true, requireActive: true, requireRole: ['admin'] },
  };

  // Public routes — no guard needed
  const PUBLIC_ROUTES = [
    '/', '/index.html',
    '/latest', '/services', '/contact',
    '/login', '/login.html',
    '/signup', '/signup/',
    '/signup/homeowner', '/signup/designer', '/signup/builder',
    '/plans', '/plans.html',
    '/social', '/social/',
    '/PORTFOLIO_B2B.html',
    '/privacy', '/privacy.html',
    '/legal/terms-of-service', '/legal/subscription-terms', '/legal/privacy-policy',
  ];

  function isPublicRoute(path) {
    return PUBLIC_ROUTES.some(r => path === r || path === r + '.html' || path === r + '/');
  }

  function findRule(path) {
    // Check most specific routes first (longer paths)
    const sorted = Object.keys(ROUTE_RULES).sort((a, b) => b.length - a.length);
    for (const prefix of sorted) {
      if (path.startsWith(prefix) || path === prefix) {
        return ROUTE_RULES[prefix];
      }
    }
    return null;
  }

  function guard() {
    const path = window.location.pathname;

    // Public routes — no guard
    if (isPublicRoute(path)) return;

    const rule = findRule(path);
    if (!rule) return; // No rule defined — allow access

    HCHCAuth.onReady(() => {
      // Check auth
      if (rule.requireAuth && !HCHCAuth.isSignedIn()) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = '/login.html?returnUrl=' + returnUrl;
        return;
      }

      // Check pending
      if (rule.requireActive && HCHCAuth.isPending()) {
        if (path !== '/account/pending.html') {
          window.location.href = '/account/pending.html';
        }
        return;
      }

      // Check active status
      if (rule.requireActive && !HCHCAuth.isActive()) {
        if (path !== '/account/pending.html') {
          window.location.href = '/account/pending.html';
        }
        return;
      }

      // Check role (admin using View As is exempt)
      if (rule.requireRole && !HCHCAuth.isAdmin()) {
        const userRole = HCHCAuth.getRole();
        if (!rule.requireRole.includes(userRole)) {
          // Redirect to their own dashboard with message
          const dashPath = _getDashboardForRole(userRole);
          window.location.href = dashPath + '?msg=access_denied';
          return;
        }
      }

      // Check tier
      if (rule.requireTier && !HCHCAuth.isAdmin()) {
        if (!HCHCAuth.hasTier(rule.requireTier)) {
          window.location.href = '/plans.html?upgrade=' + encodeURIComponent(rule.requireTier);
          return;
        }
      }
    });
  }

  function _getDashboardForRole(role) {
    switch (role) {
      case 'interior_designer': return '/dashboard/';
      case 'builder': return '/dashboard/';
      case 'homeowner': return '/dashboard/';
      default: return '/';
    }
  }

  // Auto-guard on load
  function init() {
    guard();
  }

  return { init, guard, isPublicRoute };
})();
