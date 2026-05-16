/* ============================================================
   HCHC Auth-Aware Navigation System
   Renders nav based on auth state, role, tier, and status
   Three states: Public (A), Pending (B), Authenticated (C)
   Role-specific layouts per Section 4 of Nav/Auth spec
   ============================================================ */
(function () {
  'use strict';

  // ---- CSS Variables (shared with site) ----
  const V = {
    ivory: '#F5F0EB', navy: '#1B2A4A', espresso: '#3C2A21',
    sand: '#D4C5B2', mocha: '#A37762', carrara: '#E8E4E0',
    gold: '#C4A265', dustyBlue: '#7B9BAE', sage: '#8A9A7B',
  };

  // ---- Inject nav styles ----
  const style = document.createElement('style');
  style.textContent = `
    /* ======= SHARED NAV BASE ======= */
    .hchc-nav-topbar {
      background: ${V.navy};
      color: ${V.ivory};
      padding: 14px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1000;
      font-family: 'Jost', 'Segoe UI', sans-serif;
    }
    .hchc-nav-logo {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 600;
      font-size: 1.15rem;
      color: ${V.ivory};
      text-decoration: none;
    }
    .hchc-nav-logo:hover { color: ${V.gold}; }
    .hchc-nav-center {
      display: flex;
      gap: 28px;
      align-items: center;
    }
    .hchc-nav-center a {
      color: ${V.sand};
      font-size: 0.8rem;
      font-weight: 300;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.2s;
    }
    .hchc-nav-center a:hover { color: ${V.ivory}; }
    .hchc-nav-center a.active { color: ${V.gold}; }
    .hchc-nav-right {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .hchc-nav-right a {
      color: ${V.sand};
      font-size: 0.8rem;
      font-weight: 300;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.2s;
    }
    .hchc-nav-right a:hover { color: ${V.ivory}; }
    .hchc-nav-btn {
      display: inline-block;
      background: ${V.gold};
      color: ${V.navy};
      font-family: 'Jost', sans-serif;
      font-size: 0.78rem;
      font-weight: 400;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 10px 24px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s, color 0.2s;
    }
    .hchc-nav-btn:hover {
      background: ${V.ivory};
      color: ${V.navy};
    }
    .hchc-nav-username {
      color: ${V.dustyBlue};
      font-size: 0.8rem;
      font-weight: 300;
    }
    .hchc-nav-signout {
      background: none;
      border: 1px solid rgba(255,255,255,0.2);
      color: ${V.sand};
      font-family: 'Jost', sans-serif;
      font-size: 0.72rem;
      font-weight: 300;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 16px;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
    }
    .hchc-nav-signout:hover {
      border-color: ${V.gold};
      color: ${V.ivory};
    }

    /* User dropdown */
    .hchc-nav-dropdown {
      position: relative;
    }
    .hchc-nav-dropdown-trigger {
      background: none;
      border: none;
      color: ${V.dustyBlue};
      font-family: 'Jost', sans-serif;
      font-size: 0.8rem;
      font-weight: 300;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .hchc-nav-dropdown-trigger:hover { color: ${V.ivory}; }
    .hchc-nav-dropdown-trigger::after {
      content: '';
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid currentColor;
    }
    .hchc-nav-dropdown-menu {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: ${V.navy};
      border: 1px solid rgba(255,255,255,0.1);
      min-width: 180px;
      z-index: 1001;
    }
    .hchc-nav-dropdown-menu.open { display: block; }
    .hchc-nav-dropdown-menu a,
    .hchc-nav-dropdown-menu button {
      display: block;
      width: 100%;
      text-align: left;
      padding: 10px 16px;
      color: ${V.sand};
      font-family: 'Jost', sans-serif;
      font-size: 0.78rem;
      font-weight: 300;
      letter-spacing: 0.06em;
      background: none;
      border: none;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .hchc-nav-dropdown-menu a:hover,
    .hchc-nav-dropdown-menu button:hover {
      background: rgba(255,255,255,0.06);
    }

    /* ======= HAMBURGER (mobile) ======= */
    .hchc-hamburger {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      flex-direction: column;
      gap: 5px;
    }
    .hchc-hamburger span {
      display: block;
      width: 22px;
      height: 2px;
      background: ${V.ivory};
      transition: transform 0.25s, opacity 0.25s;
    }
    .hchc-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hchc-hamburger.open span:nth-child(2) { opacity: 0; }
    .hchc-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* Mobile overlay */
    .hchc-mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: ${V.navy};
      color: ${V.ivory};
      flex-direction: column;
      font-family: 'Jost', sans-serif;
      overflow-y: auto;
    }
    .hchc-mobile-overlay.open { display: flex; }
    .hchc-mobile-overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .hchc-mobile-overlay-close {
      background: none;
      border: none;
      color: ${V.ivory};
      font-size: 28px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hchc-mobile-overlay a {
      display: block;
      padding: 14px 24px;
      color: ${V.ivory};
      font-size: 1rem;
      font-weight: 300;
      text-decoration: none;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s;
    }
    .hchc-mobile-overlay a:hover { background: rgba(255,255,255,0.06); }
    .hchc-mobile-overlay a.active { color: ${V.gold}; }
    .hchc-mobile-overlay-section {
      padding: 8px 24px 4px;
      font-size: 0.7rem;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${V.dustyBlue};
    }
    .hchc-mobile-signout {
      margin: 24px;
      background: none;
      border: 1px solid rgba(255,255,255,0.2);
      color: ${V.sand};
      font-family: 'Jost', sans-serif;
      font-size: 0.85rem;
      padding: 12px;
      cursor: pointer;
      text-align: center;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    /* ======= ADMIN SIDEBAR ======= */
    .hchc-admin-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      background: ${V.navy};
      color: ${V.ivory};
      z-index: 999;
      display: flex;
      flex-direction: column;
      transition: width 0.25s ease;
      overflow: hidden;
      font-family: 'Jost', sans-serif;
    }
    .hchc-admin-sidebar.expanded { width: 240px; }
    .hchc-admin-sidebar.collapsed { width: 60px; }
    .hchc-admin-sidebar-logo {
      padding: 20px 16px 16px;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 600;
      font-size: 1.1rem;
      color: ${V.gold};
      white-space: nowrap;
      overflow: hidden;
    }
    .hchc-admin-sidebar.collapsed .hchc-admin-sidebar-logo { font-size: 0; padding: 20px 16px; }
    .hchc-admin-sidebar-toggle {
      position: absolute;
      top: 16px;
      right: 8px;
      background: none;
      border: none;
      color: ${V.dustyBlue};
      font-size: 16px;
      cursor: pointer;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }
    .hchc-admin-sidebar-toggle:hover { color: ${V.ivory}; }
    .hchc-admin-sidebar-section {
      padding: 12px 16px 4px;
      font-size: 0.65rem;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${V.dustyBlue};
      white-space: nowrap;
      overflow: hidden;
    }
    .hchc-admin-sidebar.collapsed .hchc-admin-sidebar-section { font-size: 0; padding: 8px; }
    .hchc-admin-sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      color: ${V.sand};
      font-size: 0.85rem;
      font-weight: 300;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s;
      position: relative;
    }
    .hchc-admin-sidebar-link:hover { background: rgba(255,255,255,0.06); }
    .hchc-admin-sidebar-link.active { color: ${V.gold}; background: rgba(196,162,101,0.08); }
    .hchc-admin-sidebar-link .icon {
      width: 20px;
      text-align: center;
      flex-shrink: 0;
      font-size: 1rem;
    }
    .hchc-admin-sidebar-link .label { overflow: hidden; }
    .hchc-admin-sidebar.collapsed .hchc-admin-sidebar-link .label { width: 0; overflow: hidden; }
    .hchc-admin-sidebar.collapsed .hchc-admin-sidebar-link[data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      left: 60px;
      top: 50%;
      transform: translateY(-50%);
      background: ${V.espresso};
      color: ${V.ivory};
      padding: 6px 12px;
      font-size: 0.75rem;
      white-space: nowrap;
      z-index: 10000;
    }
    .hchc-admin-sidebar-bottom {
      margin-top: auto;
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .hchc-admin-sidebar-bottom button,
    .hchc-admin-sidebar-bottom select {
      display: block;
      width: 100%;
      margin-bottom: 8px;
      background: none;
      border: 1px solid rgba(255,255,255,0.15);
      color: ${V.sand};
      font-family: 'Jost', sans-serif;
      font-size: 0.75rem;
      padding: 8px;
      cursor: pointer;
      text-align: center;
    }
    .hchc-admin-sidebar-bottom select option { background: ${V.navy}; }
    .hchc-admin-content-offset { transition: margin-left 0.25s ease; }

    /* ======= VIEW AS BANNER ======= */
    .hchc-viewas-banner {
      display: none;
      background: ${V.gold};
      color: ${V.navy};
      text-align: center;
      padding: 8px 16px;
      font-family: 'Jost', sans-serif;
      font-size: 0.8rem;
      font-weight: 400;
      position: sticky;
      top: 0;
      z-index: 1001;
    }
    .hchc-viewas-banner.active { display: block; }
    .hchc-viewas-banner a {
      color: ${V.navy};
      font-weight: 600;
      margin-left: 12px;
      text-decoration: underline;
    }

    /* ======= RESPONSIVE ======= */
    /* Mobile: show hamburger, hide desktop links */
    @media (max-width: 767px) {
      .hchc-hamburger { display: flex; }
      .hchc-nav-center { display: none; }
      .hchc-nav-right .hchc-nav-dropdown { display: none; }
      .hchc-nav-right a.hchc-desktop-only { display: none; }
      .hchc-admin-sidebar { display: none; }
      .hchc-admin-content-offset { margin-left: 0 !important; }
    }
    /* Desktop: hide hamburger */
    @media (min-width: 768px) {
      .hchc-hamburger { display: none !important; }
      .hchc-mobile-overlay { display: none !important; }
    }

    /* Homeowner: keep flat top bar on mobile (no hamburger) */
    .hchc-nav-homeowner .hchc-hamburger { display: none !important; }
    @media (max-width: 767px) {
      .hchc-nav-homeowner .hchc-nav-center {
        display: flex;
        gap: 12px;
      }
      .hchc-nav-homeowner .hchc-nav-center a {
        font-size: 0.7rem;
        letter-spacing: 0.06em;
      }
    }
    @media (max-width: 374px) {
      .hchc-nav-homeowner .hchc-hamburger { display: flex !important; }
      .hchc-nav-homeowner .hchc-nav-center { display: none !important; }
    }

    /* Remove the old floating hamburger nav trigger */
    .gnav-trigger, .gnav-backdrop, .gnav-panel { display: none !important; }
  `;
  document.head.appendChild(style);

  // ---- State ----
  let _navContainer = null;
  let _mobileOverlay = null;
  let _adminSidebar = null;
  let _viewAsBanner = null;

  const currentPath = window.location.pathname;

  function isActive(href) {
    if (href.startsWith('/#')) return false; // hash links on index page — never highlight
    if (href === '/' && currentPath === '/') return true;
    if (href === '/' && currentPath !== '/') return false;
    return currentPath.startsWith(href);
  }

  // ---- NAV LINK DEFINITIONS ----

  const PUBLIC_LINKS = [
    { name: 'Latest', href: '/#latest' },
    { name: 'Services', href: '/#services' },
    { name: 'For Professionals', href: '/#tools' },
    { name: 'Contact', href: '/#contact' },
  ];

  const DESIGNER_LINKS = [
    { name: 'Dashboard', href: '/dashboard/' },
    { name: 'My Projects', href: '/dashboard/designer/' },
    { name: 'Presentation Engine', href: '/presentation-engine.html', tierGated: 'tier_2' },
    { name: 'Account', href: '/account/settings.html' },
  ];

  const BUILDER_LINKS = [
    { name: 'Dashboard', href: '/dashboard/' },
    { name: 'My Projects', href: '/dashboard/builder/' },
    { name: 'Submit a Project', href: '/dashboard/submit-project.html' },
    { name: 'Presentation Engine', href: '/presentation-engine.html', tierGated: 'tier_2' },
  ];

  const HOMEOWNER_LINKS = [
    { name: 'My Project', href: '/dashboard/homeowner/' },
    { name: 'Messages', href: '/dashboard/homeowner/messages' },
    { name: 'Invoices', href: '/dashboard/homeowner/invoices' },
  ];

  const ADMIN_SIDEBAR_SECTIONS = [
    {
      label: 'Overview',
      links: [
        { name: 'Admin Dashboard', href: '/admin/', icon: '\u{1F3E0}' },
      ]
    },
    {
      label: 'Users',
      links: [
        { name: 'User Approvals', href: '/admin/user-approvals.html', icon: '\u2713' },
        { name: 'User Management', href: '/admin/user-management.html', icon: '\u{1F465}' },
      ]
    },
    {
      label: 'Content',
      links: [
        { name: 'Content Queue', href: '/admin/content-queue.html', icon: '\u{1F4DD}' },
        { name: 'Social Media Queue', href: '/dashboard/social-queue.html', icon: '\u{1F4F1}' },
        { name: 'Posts', href: '/admin/posts.html', icon: '\u{1F4F0}' },
      ]
    },
    {
      label: 'Projects',
      links: [
        { name: 'Project Review', href: '/admin/project-review.html', icon: '\u{1F4C1}' },
      ]
    },
    {
      label: 'Platform',
      links: [
        { name: 'Material Library', href: '/materials.html', icon: '\u{1F3A8}' },
        { name: 'Presentation Engine', href: '/presentation-engine.html', icon: '\u{1F4CA}' },
        { name: 'Platform Settings', href: '/admin/settings.html', icon: '\u2699' },
      ]
    },
  ];

  // ---- RENDER FUNCTIONS ----

  function renderPublicNav() {
    const nav = document.createElement('nav');
    nav.className = 'hchc-nav-topbar';
    nav.innerHTML = `
      <a href="/" class="hchc-nav-logo">Hill Country Home Concepts</a>
      <div class="hchc-nav-center">
        ${PUBLIC_LINKS.map(l => `<a href="${l.href}" class="${isActive(l.href) ? 'active' : ''}">${l.name}</a>`).join('')}
      </div>
      <div class="hchc-nav-right">
        <a href="/login.html" class="hchc-desktop-only">Sign In</a>
        <a href="/signup/" class="hchc-nav-btn">Get Started</a>
        <button class="hchc-hamburger" aria-label="Open menu"><span></span><span></span><span></span></button>
      </div>
    `;
    _navContainer = nav;
    document.body.prepend(nav);

    // Mobile overlay
    _mobileOverlay = _buildMobileOverlay(PUBLIC_LINKS, false);
    document.body.appendChild(_mobileOverlay);
    _wireHamburger(nav);
  }

  function renderPendingNav() {
    const name = HCHCAuth.getFirstName() || 'User';
    const nav = document.createElement('nav');
    nav.className = 'hchc-nav-topbar';
    nav.innerHTML = `
      <a href="/" class="hchc-nav-logo">Hill Country Home Concepts</a>
      <div class="hchc-nav-right">
        <span class="hchc-nav-username">${_escHtml(name)}</span>
        <button class="hchc-nav-signout" onclick="HCHCAuth.signOut()">Sign Out</button>
      </div>
    `;
    _navContainer = nav;
    document.body.prepend(nav);
  }

  function renderAuthenticatedNav() {
    const role = HCHCAuth.getEffectiveRole();

    if (role === 'admin' && !HCHCAuth.getViewAsRole()) {
      _renderAdminSidebar();
    } else if (role === 'homeowner') {
      _renderTopBar(HOMEOWNER_LINKS, 'homeowner');
    } else if (role === 'interior_designer') {
      _renderTopBar(_applyTierGating(DESIGNER_LINKS), 'designer');
    } else if (role === 'builder') {
      _renderTopBar(_applyTierGating(BUILDER_LINKS), 'builder');
    } else {
      // Fallback
      _renderTopBar([], 'default');
    }

    // View As banner
    _renderViewAsBanner();
  }

  function _applyTierGating(links) {
    return links.map(l => {
      if (!l.tierGated) return l;
      if (HCHCAuth.hasTier(l.tierGated) || HCHCAuth.isAdmin()) return l;
      return { ...l, name: 'Upgrade to Access', href: '/plans.html' };
    });
  }

  function _renderTopBar(links, roleClass) {
    const name = HCHCAuth.getFirstName() || 'User';
    const isHomeowner = roleClass === 'homeowner';
    const nav = document.createElement('nav');
    nav.className = 'hchc-nav-topbar' + (isHomeowner ? ' hchc-nav-homeowner' : '');
    nav.innerHTML = `
      <a href="/" class="hchc-nav-logo">Hill Country Home Concepts</a>
      <div class="hchc-nav-center">
        ${links.map(l => `<a href="${l.href}" class="${isActive(l.href) ? 'active' : ''}">${l.name}</a>`).join('')}
      </div>
      <div class="hchc-nav-right">
        <div class="hchc-nav-dropdown">
          <button class="hchc-nav-dropdown-trigger">${_escHtml(name)}</button>
          <div class="hchc-nav-dropdown-menu">
            <a href="/account/settings.html">Account Settings</a>
            <button onclick="HCHCAuth.signOut()">Sign Out</button>
          </div>
        </div>
        ${isHomeowner ? '' : '<button class="hchc-hamburger" aria-label="Open menu"><span></span><span></span><span></span></button>'}
      </div>
    `;
    _navContainer = nav;
    document.body.prepend(nav);

    // Dropdown toggle
    const trigger = nav.querySelector('.hchc-nav-dropdown-trigger');
    const menu = nav.querySelector('.hchc-nav-dropdown-menu');
    if (trigger && menu) {
      trigger.addEventListener('click', () => menu.classList.toggle('open'));
      document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('open');
      });
    }

    // Mobile overlay
    if (!isHomeowner) {
      _mobileOverlay = _buildMobileOverlay(links, true);
      document.body.appendChild(_mobileOverlay);
      _wireHamburger(nav);
    }
  }

  function _renderAdminSidebar() {
    const savedState = localStorage.getItem('hchc_admin_sidebar_state') || 'expanded';

    const sidebar = document.createElement('aside');
    sidebar.className = 'hchc-admin-sidebar ' + savedState;
    sidebar.id = 'admin-sidebar';

    let html = `
      <div class="hchc-admin-sidebar-logo">HCHC Admin</div>
      <button class="hchc-admin-sidebar-toggle" aria-label="Toggle sidebar">${savedState === 'expanded' ? '\u25C0' : '\u25B6'}</button>
    `;

    ADMIN_SIDEBAR_SECTIONS.forEach(section => {
      html += `<div class="hchc-admin-sidebar-section">${section.label}</div>`;
      section.links.forEach(link => {
        html += `
          <a href="${link.href}" class="hchc-admin-sidebar-link ${isActive(link.href) ? 'active' : ''}" data-tooltip="${link.name}">
            <span class="icon">${link.icon}</span>
            <span class="label">${link.name}</span>
          </a>`;
      });
    });

    html += `
      <div class="hchc-admin-sidebar-bottom">
        <select id="admin-view-as" onchange="HCHCNav._onViewAsChange(this.value)">
          <option value="">View As...</option>
          <option value="builder">View as Builder</option>
          <option value="interior_designer">View as Designer</option>
          <option value="homeowner">View as Homeowner</option>
        </select>
        <button onclick="HCHCAuth.signOut()">Sign Out</button>
      </div>
    `;

    sidebar.innerHTML = html;
    _adminSidebar = sidebar;
    document.body.prepend(sidebar);

    // Offset main content
    document.body.style.marginLeft = savedState === 'expanded' ? '240px' : '60px';
    document.body.style.transition = 'margin-left 0.25s ease';

    // Toggle handler
    const toggle = sidebar.querySelector('.hchc-admin-sidebar-toggle');
    toggle.addEventListener('click', () => {
      const isExpanded = sidebar.classList.contains('expanded');
      sidebar.classList.toggle('expanded', !isExpanded);
      sidebar.classList.toggle('collapsed', isExpanded);
      toggle.textContent = isExpanded ? '\u25B6' : '\u25C0';
      document.body.style.marginLeft = isExpanded ? '60px' : '240px';
      localStorage.setItem('hchc_admin_sidebar_state', isExpanded ? 'collapsed' : 'expanded');
    });

    // Admin mobile hamburger (replaces sidebar on mobile)
    const mobileNav = document.createElement('nav');
    mobileNav.className = 'hchc-nav-topbar';
    mobileNav.style.display = 'none';
    mobileNav.innerHTML = `
      <a href="/" class="hchc-nav-logo">HCHC Admin</a>
      <div class="hchc-nav-right">
        <button class="hchc-hamburger" aria-label="Open menu" style="display:flex"><span></span><span></span><span></span></button>
      </div>
    `;
    document.body.prepend(mobileNav);

    // Show mobile nav, hide sidebar on small screens
    const mql = window.matchMedia('(max-width: 767px)');
    function handleMobile(e) {
      if (e.matches) {
        sidebar.style.display = 'none';
        mobileNav.style.display = 'flex';
        document.body.style.marginLeft = '0';
      } else {
        sidebar.style.display = 'flex';
        mobileNav.style.display = 'none';
        const state = localStorage.getItem('hchc_admin_sidebar_state') || 'expanded';
        document.body.style.marginLeft = state === 'expanded' ? '240px' : '60px';
      }
    }
    mql.addEventListener('change', handleMobile);
    handleMobile(mql);

    // Build mobile overlay with all admin links
    const allAdminLinks = [];
    ADMIN_SIDEBAR_SECTIONS.forEach(s => s.links.forEach(l => allAdminLinks.push(l)));
    _mobileOverlay = _buildMobileOverlay(allAdminLinks, true);
    document.body.appendChild(_mobileOverlay);

    // Wire hamburger on mobile nav
    const burger = mobileNav.querySelector('.hchc-hamburger');
    if (burger) {
      burger.addEventListener('click', () => {
        _mobileOverlay.classList.toggle('open');
        burger.classList.toggle('open');
      });
    }
  }

  function _renderViewAsBanner() {
    const viewAsRole = HCHCAuth.getViewAsRole();
    if (!viewAsRole) return;

    const roleLabels = { builder: 'Builder', interior_designer: 'Interior Designer', homeowner: 'Homeowner' };
    const banner = document.createElement('div');
    banner.className = 'hchc-viewas-banner active';
    banner.innerHTML = `Viewing as ${roleLabels[viewAsRole] || viewAsRole} <a href="#" onclick="HCHCNav._onViewAsChange(''); return false;">Exit View As</a>`;
    _viewAsBanner = banner;
    document.body.prepend(banner);
  }

  // ---- MOBILE OVERLAY BUILDER ----

  function _buildMobileOverlay(links, showSignOut) {
    const overlay = document.createElement('div');
    overlay.className = 'hchc-mobile-overlay';
    let html = `
      <div class="hchc-mobile-overlay-header">
        <span style="font-family: 'Cormorant Garamond', serif; font-weight: 600; color: ${V.gold}">HCHC</span>
        <button class="hchc-mobile-overlay-close" aria-label="Close menu">&times;</button>
      </div>
    `;
    links.forEach(l => {
      html += `<a href="${l.href}" class="${isActive(l.href) ? 'active' : ''}">${l.name}</a>`;
    });
    if (showSignOut) {
      html += `<button class="hchc-mobile-signout" onclick="HCHCAuth.signOut()">Sign Out</button>`;
    } else {
      html += `<a href="/login.html">Sign In</a>`;
      html += `<a href="/signup/" style="color:${V.gold}">Get Started</a>`;
    }
    overlay.innerHTML = html;

    // Close handler
    overlay.querySelector('.hchc-mobile-overlay-close').addEventListener('click', () => {
      overlay.classList.remove('open');
      document.querySelectorAll('.hchc-hamburger').forEach(b => b.classList.remove('open'));
    });

    // Close on link click
    overlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => overlay.classList.remove('open'));
    });

    return overlay;
  }

  function _wireHamburger(navEl) {
    const burger = navEl.querySelector('.hchc-hamburger');
    if (!burger || !_mobileOverlay) return;
    burger.addEventListener('click', () => {
      _mobileOverlay.classList.toggle('open');
      burger.classList.toggle('open');
    });
  }

  // ---- VIEW AS HANDLER ----

  function _onViewAsChange(role) {
    HCHCAuth.setViewAs(role || null);
    window.location.reload();
  }

  // ---- CLEANUP & RENDER ----

  function _clearNav() {
    // Remove any existing nav elements we created
    document.querySelectorAll('.hchc-nav-topbar, .hchc-admin-sidebar, .hchc-mobile-overlay, .hchc-viewas-banner').forEach(el => el.remove());
    document.body.style.marginLeft = '';
    _navContainer = null;
    _mobileOverlay = null;
    _adminSidebar = null;
    _viewAsBanner = null;
  }

  function render() {
    _clearNav();

    // Remove any old nav topbar that pages have built-in (like dashboard.html's .topbar)
    const oldTopbar = document.querySelector('.topbar');
    if (oldTopbar) oldTopbar.remove();

    const state = HCHCAuth.getNavState();
    switch (state) {
      case 'public': renderPublicNav(); break;
      case 'pending': renderPendingNav(); break;
      case 'authenticated': renderAuthenticatedNav(); break;
    }
  }

  // ---- INIT ----

  function init() {
    HCHCAuth.onReady(() => {
      render();
    });

    // Re-render on auth state change
    HCHCAuth.onChange(() => {
      render();
    });
  }

  function _escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Expose for View As select handler
  window.HCHCNav = { _onViewAsChange, init, render };

  // Auto-init
  init();
})();
