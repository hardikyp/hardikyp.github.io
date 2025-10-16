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
  // Play name pronunciation with animated waves
  const playBtn = document.getElementById('playNamePronunciation');
  const nameAudio = document.getElementById('namePronunciation');
  if (playBtn && nameAudio) {
    const updatePlayingState = () => {
      const playing = !nameAudio.paused && !nameAudio.ended;
      playBtn.classList.toggle('is-playing', playing);
      playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    };
    playBtn.addEventListener('click', () => {
      try {
        if (nameAudio.paused || nameAudio.ended) {
          nameAudio.currentTime = 0;
          nameAudio.play()?.catch(() => {});
        } else {
          nameAudio.pause();
        }
      } catch (e) {}
    });
    nameAudio.addEventListener('playing', updatePlayingState);
    nameAudio.addEventListener('pause', updatePlayingState);
    nameAudio.addEventListener('ended', updatePlayingState);
  }

  // Publications filters
  const filterChips = document.querySelectorAll('.pub-filters .chip');
  const pubItems = document.querySelectorAll('.pub-item');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      const f = chip.getAttribute('data-filter');
      pubItems.forEach(item => {
        const cat = item.getAttribute('data-cat');
        const show = f === 'all' || f === cat;
        item.style.display = show ? '' : 'none';
      });
    });
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Back-to-top button
  const backToTop = document.querySelector('.back-to-top');
  const hero = document.querySelector('main > section');
  const toggleBackToTop = () => {
    if (!backToTop || !hero) return;
    const threshold = hero.offsetHeight || 400;
    if (window.scrollY > threshold) backToTop.classList.add('is-visible');
    else backToTop.classList.remove('is-visible');
  };
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
})();
