(() => {
  const header = document.getElementById('site-header');
  const menuToggle = document.getElementById('menuToggle');
  const menuCheckbox = document.getElementById('menuCheckbox');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  const yearEl = document.getElementById('year');

  // Footer year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Shrink header on scroll
  const updateHeaderState = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    if (!header) return;
    header.classList.toggle('scrolled', y > 10);
  };
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  updateHeaderState();

  const syncMenuState = () => {
    if (!menuCheckbox) return;
    const isOpen = menuCheckbox.checked;
    menuCheckbox.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menuCheckbox.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    menuToggle?.classList.toggle('is-open', isOpen);
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (menuOverlay) menuOverlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  };
  const closeMenu = () => {
    if (!menuCheckbox) return;
    menuCheckbox.checked = false;
    syncMenuState();
  };

  menuCheckbox?.addEventListener('change', syncMenuState);
  syncMenuState();
  document.querySelectorAll('.mobile-menu a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
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

  // Smooth contact scroll handling across pages
  const CONTACT_SELECTOR = '#contact';
  const CONTACT_SCROLL_KEY = 'hp:scroll-to-contact';
  const smoothScrollIntoView = (el) => {
    if (!el) return false;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return true;
  };
  const queueContactScroll = () => {
    try { sessionStorage.setItem(CONTACT_SCROLL_KEY, CONTACT_SELECTOR); } catch (_) {}
  };
  const handleContactLinks = () => {
    const contactLinks = document.querySelectorAll('a[href$="#contact"]');
    if (!contactLinks.length) return;
    contactLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        const contactSection = document.querySelector(CONTACT_SELECTOR);
        closeMenu();
        if (contactSection) {
          event.preventDefault();
          smoothScrollIntoView(contactSection);
        } else {
          queueContactScroll();
        }
      });
    });
  };
  handleContactLinks();
  const applyQueuedContactScroll = () => {
    const contactSection = document.querySelector(CONTACT_SELECTOR);
    if (!contactSection) return;
    let shouldScroll = window.location.hash === CONTACT_SELECTOR;
    if (!shouldScroll) {
      try {
        const pending = sessionStorage.getItem(CONTACT_SCROLL_KEY);
        if (pending === CONTACT_SELECTOR) {
          shouldScroll = true;
          sessionStorage.removeItem(CONTACT_SCROLL_KEY);
        }
      } catch (_) {}
    }
    if (!shouldScroll) return;
    const run = () => smoothScrollIntoView(contactSection);
    if (document.readyState === 'complete') setTimeout(run, 120);
    else window.addEventListener('load', () => setTimeout(run, 120), { once: true });
  };
  applyQueuedContactScroll();

  // Back-to-top button
  const backToTop = document.querySelector('.back-to-top');
  const getScrollThreshold = () => 24;
  const toggleBackToTop = () => {
    if (!backToTop) return;
    const threshold = getScrollThreshold();
    if (window.scrollY > threshold) backToTop.classList.add('is-visible');
    else backToTop.classList.remove('is-visible');
  };
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
})();
