(() => {
  const header = document.getElementById('site-header');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('menuOverlay');
  const yearEl = document.getElementById('year');

  // Footer year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
    navToggle?.classList.add('is-active');
    navToggle?.setAttribute('aria-expanded', 'true');
    navToggle?.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    mobileMenu?.classList.remove('open');
    overlay?.classList.remove('show');
    navToggle?.classList.remove('is-active');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
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
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();

