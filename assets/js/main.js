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
  const updateHeaderState = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    if (!header) return;
    header.classList.toggle('scrolled', y > 10);
  };
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  updateHeaderState();

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
  const PROGRESS_VIEWBOX = 64;
  const PROGRESS_RADIUS = 30;
  const PROGRESS_CENTER = PROGRESS_VIEWBOX / 2;
  const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;
  let progressCircle;
  const getScrollThreshold = () => 24;

  const createProgressIndicator = () => {
    if (!backToTop) return;
    const wrapper = document.createElement('span');
    wrapper.className = 'back-to-top__progress';
    wrapper.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${PROGRESS_VIEWBOX} ${PROGRESS_VIEWBOX}`);
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('cx', PROGRESS_CENTER.toString());
    track.setAttribute('cy', PROGRESS_CENTER.toString());
    track.setAttribute('r', PROGRESS_RADIUS.toString());
    track.classList.add('back-to-top__progress-track');
    const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    indicator.setAttribute('cx', PROGRESS_CENTER.toString());
    indicator.setAttribute('cy', PROGRESS_CENTER.toString());
    indicator.setAttribute('r', PROGRESS_RADIUS.toString());
    indicator.classList.add('back-to-top__progress-active');
    indicator.style.strokeDasharray = `${PROGRESS_CIRCUMFERENCE}`;
    indicator.style.strokeDashoffset = `${PROGRESS_CIRCUMFERENCE}`;
    svg.appendChild(track);
    svg.appendChild(indicator);
    wrapper.appendChild(svg);
    backToTop.appendChild(wrapper);
    progressCircle = indicator;
  };
  createProgressIndicator();
  const toggleBackToTop = () => {
    if (!backToTop) return;
    const threshold = getScrollThreshold();
    if (window.scrollY > threshold) backToTop.classList.add('is-visible');
    else backToTop.classList.remove('is-visible');
  };
  const updateScrollProgress = () => {
    if (!progressCircle) return;
    const scrollTop = Math.max(
      window.scrollY || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0
    );
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const maxScroll = Math.max(0, pageHeight - viewportHeight);
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
    const offset = PROGRESS_CIRCUMFERENCE * (1 - progress);
    progressCircle.style.strokeDashoffset = `${Math.max(0, offset)}`;
  };
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  const handleScroll = () => {
    toggleBackToTop();
    updateScrollProgress();
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
})();
