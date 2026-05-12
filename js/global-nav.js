/* ============================================
   HCHC Global Navigation — Hamburger Menu
   Self-contained: injects CSS + HTML, no deps
   ============================================ */
(function () {
  'use strict';

  const NAV_SECTIONS = [
    {
      label: 'Main Site',
      links: [
        { name: 'Home', href: '/' },
        { name: 'Portfolio (B2B)', href: '/PORTFOLIO_B2B.html' },
        { name: 'Privacy Policy', href: '/privacy.html' }
      ]
    },
    {
      label: 'Tools',
      links: [
        { name: 'Dashboard', href: '/dashboard.html' },
        { name: 'Materials', href: '/materials.html' },
        { name: 'Presentation Engine', href: '/presentation-engine.html' }
      ]
    },
    {
      label: 'Social',
      links: [
        { name: 'Social Feed', href: '/social/' },
        { name: 'Social Queue', href: '/dashboard/social-queue.html' }
      ]
    },
    {
      label: 'SelectFlow',
      links: [
        { name: 'HC Finishing Home', href: '/hc-finishing/' },
        { name: 'Dashboard', href: '/hc-finishing/dashboard.html' },
        { name: 'Upload', href: '/hc-finishing/upload.html' },
        { name: 'Review', href: '/hc-finishing/review.html' },
        { name: 'Materials', href: '/hc-finishing/materials.html' },
        { name: 'Presentations', href: '/hc-finishing/presentation.html' }
      ]
    }
  ];

  // --- CSS injection ---
  const style = document.createElement('style');
  style.textContent = `
    /* Hamburger trigger */
    .gnav-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99998;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #1B2A4A;
      border: 2px solid #C4A265;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      box-shadow: 0 4px 16px rgba(0,0,0,.3);
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .gnav-trigger:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(0,0,0,.4);
    }
    .gnav-trigger span {
      display: block;
      width: 22px;
      height: 2px;
      background: #F5F0EB;
      border-radius: 2px;
      transition: transform .25s ease, opacity .25s ease;
    }
    /* Animate to X when open */
    .gnav-trigger.gnav-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .gnav-trigger.gnav-open span:nth-child(2) { opacity: 0; }
    .gnav-trigger.gnav-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* Backdrop */
    .gnav-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99998;
      background: rgba(0,0,0,.45);
      opacity: 0;
      visibility: hidden;
      transition: opacity .3s ease, visibility .3s ease;
    }
    .gnav-backdrop.gnav-visible {
      opacity: 1;
      visibility: visible;
    }

    /* Panel */
    .gnav-panel {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 99999;
      width: 300px;
      max-width: 85vw;
      height: 100vh;
      background: #1B2A4A;
      color: #F5F0EB;
      transform: translateX(100%);
      transition: transform .3s cubic-bezier(.4,0,.2,1);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      font-family: 'Jost', 'Segoe UI', sans-serif;
    }
    .gnav-panel.gnav-visible {
      transform: translateX(0);
    }

    /* Close button */
    .gnav-close {
      align-self: flex-end;
      margin: 16px 16px 0 0;
      background: none;
      border: none;
      color: #F5F0EB;
      font-size: 28px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background .15s;
    }
    .gnav-close:hover { background: rgba(255,255,255,.1); }

    /* Brand header */
    .gnav-brand {
      padding: 8px 24px 20px;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 20px;
      font-weight: 600;
      color: #C4A265;
      letter-spacing: .5px;
    }

    /* Sections */
    .gnav-section {
      padding: 0 24px 16px;
    }
    .gnav-section-label {
      font-size: 11px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #7B9BAE;
      margin-bottom: 8px;
    }
    .gnav-section a {
      display: block;
      padding: 8px 12px;
      color: #F5F0EB;
      text-decoration: none;
      font-size: 15px;
      font-weight: 300;
      border-radius: 6px;
      transition: background .15s, color .15s;
    }
    .gnav-section a:hover {
      background: rgba(255,255,255,.08);
    }
    .gnav-section a.gnav-active {
      color: #C4A265;
      font-weight: 400;
      background: rgba(196,162,101,.1);
    }

    .gnav-divider {
      height: 1px;
      background: rgba(255,255,255,.08);
      margin: 4px 24px 12px;
    }
  `;
  document.head.appendChild(style);

  // --- Determine current page ---
  var currentPath = window.location.pathname;
  // Normalize: /index.html → /
  if (currentPath.endsWith('/index.html')) {
    currentPath = currentPath.slice(0, -10);
  }
  // Ensure trailing slash consistency for directories
  if (currentPath === '') currentPath = '/';

  function isActive(href) {
    var h = href;
    if (h.endsWith('/index.html')) h = h.slice(0, -10);
    if (h === '' || h === '/index.html') h = '/';
    return currentPath === h || currentPath === h + '/' || currentPath + '/' === h;
  }

  // --- Build HTML ---
  // Backdrop
  var backdrop = document.createElement('div');
  backdrop.className = 'gnav-backdrop';
  document.body.appendChild(backdrop);

  // Panel
  var panel = document.createElement('div');
  panel.className = 'gnav-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Site navigation');

  var closeBtn = document.createElement('button');
  closeBtn.className = 'gnav-close';
  closeBtn.setAttribute('aria-label', 'Close navigation');
  closeBtn.innerHTML = '&times;';
  panel.appendChild(closeBtn);

  var brand = document.createElement('div');
  brand.className = 'gnav-brand';
  brand.textContent = 'HCHC';
  panel.appendChild(brand);

  NAV_SECTIONS.forEach(function (section, idx) {
    if (idx > 0) {
      var divider = document.createElement('div');
      divider.className = 'gnav-divider';
      panel.appendChild(divider);
    }
    var sec = document.createElement('div');
    sec.className = 'gnav-section';

    var lbl = document.createElement('div');
    lbl.className = 'gnav-section-label';
    lbl.textContent = section.label;
    sec.appendChild(lbl);

    section.links.forEach(function (link) {
      var a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.name;
      if (isActive(link.href)) a.classList.add('gnav-active');
      sec.appendChild(a);
    });

    panel.appendChild(sec);
  });

  document.body.appendChild(panel);

  // Trigger button
  var trigger = document.createElement('button');
  trigger.className = 'gnav-trigger';
  trigger.setAttribute('aria-label', 'Open navigation');
  trigger.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(trigger);

  // --- Open / close logic ---
  function openNav() {
    panel.classList.add('gnav-visible');
    backdrop.classList.add('gnav-visible');
    trigger.classList.add('gnav-open');
    trigger.setAttribute('aria-label', 'Close navigation');
  }
  function closeNav() {
    panel.classList.remove('gnav-visible');
    backdrop.classList.remove('gnav-visible');
    trigger.classList.remove('gnav-open');
    trigger.setAttribute('aria-label', 'Open navigation');
  }
  function toggleNav() {
    panel.classList.contains('gnav-visible') ? closeNav() : openNav();
  }

  trigger.addEventListener('click', toggleNav);
  closeBtn.addEventListener('click', closeNav);
  backdrop.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
})();
