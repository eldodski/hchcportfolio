// ============================================================
// HCHC Page Init — Include at the bottom of every HTML page
// Initializes auth context, route guard, and nav in correct order
// ============================================================
(async function () {
  'use strict';
  // 1. Init auth context (loads Clerk, fetches Supabase profile)
  await HCHCAuth.init();
  // 2. Run route guard (redirects if unauthorized)
  HCHCRouteGuard.init();
  // 3. Nav renders automatically via HCHCAuth.onReady in global-nav.js
})();
