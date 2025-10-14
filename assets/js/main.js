(() => {
  const header = document.getElementById('site-header');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('menuOverlay');
  const menuHeader = document.getElementById('mobileMenuHeader');
  const navInner = header?.querySelector('.nav-inner');
  const yearEl = document.getElementById('year');

  // Footer year
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  // Ensure overlay and menu cover entire viewport (move out of header if necessary)
  if (overlay && overlay.parentElement && overlay.parentElement.tagName.toLowerCase() === 'header') {
    try { document.body.appendChild(overlay); } catch (e) {}
  }
  if (mobileMenu && mobileMenu.parentElement && mobileMenu.parentElement.tagName.toLowerCase() === 'header') {
    try { document.body.appendChild(mobileMenu); } catch (e) {}
  }

  // Shrink header on scroll
  let lastKnownY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY || window.pageYOffset;
    if (Math.abs(y - lastKnownY) > 4) {
      if (y > 10) header?.classList.add('scrolled');
      else header?.classList.remove('scrolled');
      lastKnownY = y;
    }
  }, { passive: true });

  const openMenu = () => {
    mobileMenu?.classList.add('open');
    mobileMenu?.removeAttribute('hidden');
    overlay?.classList.add('show');
    overlay?.removeAttribute('hidden');
    // Move toggle into in-panel header to sit above overlay but keep alignment via padding
    if (menuHeader && navToggle) {
      try { menuHeader.appendChild(navToggle); } catch (e) {}
    }
    navToggle?.classList.add('is-active');
    navToggle?.setAttribute('aria-expanded', 'true');
    navToggle?.setAttribute('aria-label', 'Close menu');
    // Keep page scrollbars visible; do not lock body
  };
  const closeMenu = () => {
    mobileMenu?.classList.remove('open');
    overlay?.classList.remove('show');
    navToggle?.classList.remove('is-active');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Open menu');
    // Body scrolling unchanged
    // Move toggle back to header
    if (navInner && navToggle) {
      try { navInner.appendChild(navToggle); } catch (e) {}
    }
    // Hide after animation for a11y
    setTimeout(() => {
      if (!mobileMenu?.classList.contains('open')) mobileMenu?.setAttribute('hidden', '');
      if (!overlay?.classList.contains('show')) overlay?.setAttribute('hidden', '');
    }, 220);
  };

  navToggle?.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });
  overlay?.addEventListener('click', closeMenu);
  // Play name pronunciation if available
  const playBtn = document.getElementById('playNamePronunciation');
  const nameAudio = document.getElementById('namePronunciation');
  playBtn?.addEventListener('click', () => {
    try { nameAudio?.play(); } catch (e) {}
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();
