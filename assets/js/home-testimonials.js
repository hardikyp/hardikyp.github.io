(() => {
  const carousel = document.querySelector('[data-testimonials-carousel]');
  if (!carousel) return;
  const section = carousel.closest('.testimonials');
  const controls = document.querySelector('.testimonials-controls');
  const btnPrev = document.querySelector('[data-testimonials-nav="prev"]');
  const btnNext = document.querySelector('[data-testimonials-nav="next"]');

  const source = 'assets/data/testimonials.json';
  const desktopMedia = window.matchMedia('(min-width: 1025px)');
  const tabletMedia = window.matchMedia('(min-width: 768px)');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let viewport;
  let slides = [];
  let statusEl;
  let activeIndex = 0;
  let scrollFrame = 0;

  const getInitials = (name = '') =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  const renderImage = (src, alt, options = {}) => {
    if (window.siteImages?.renderResponsiveImage) {
      return window.siteImages.renderResponsiveImage({ src, alt, ...options });
    }
    return `<img class="${options.className || ''}" src="${src}" alt="${alt}" loading="${options.loading || 'lazy'}" decoding="${options.decoding || 'async'}" />`;
  };

  const renderCard = (item) => {
    const name = item.name ?? '';
    const title = item.title ?? '';
    const affiliation = item.affiliation ?? '';
    const quote = item.quote ?? '';
    const photoMarkup = item.photo
      ? renderImage(item.photo, `Portrait of ${name}`, { className: 'testimonial-card__photo', loading: 'lazy', decoding: 'async', sizes: '64px', preferredWidth: 128 })
      : `<div class="testimonial-card__photo testimonial-card__photo--placeholder" aria-hidden="true">${getInitials(name)}</div>`;

    return `
      <article class="testimonial-card">
        <div class="testimonial-card__profile">
          ${photoMarkup}
          <div>
            <p class="testimonial-card__name">${name}</p>
            <p class="testimonial-card__meta">
              <span class="testimonial-card__title">${title}</span>
              <span class="testimonial-card__affiliation">${affiliation}</span>
            </p>
          </div>
        </div>
        <blockquote>
          <p>${quote}</p>
        </blockquote>
      </article>
    `;
  };

  const getSlidesPerView = () => {
    if (desktopMedia.matches) return 3;
    if (tabletMedia.matches) return 2;
    return 1;
  };

  const getMaxIndex = () => Math.max(0, slides.length - getSlidesPerView());

  const getStep = () => {
    if (!viewport || slides.length < 2) return viewport?.clientWidth || 0;
    return slides[1].offsetLeft - slides[0].offsetLeft;
  };

  const setButtonState = () => {
    const isStatic = slides.length <= getSlidesPerView();
    carousel.classList.toggle('is-static', isStatic);
    if (controls) controls.hidden = isStatic;
    if (btnPrev) {
      btnPrev.disabled = isStatic || activeIndex <= 0;
      btnPrev.setAttribute('aria-disabled', btnPrev.disabled ? 'true' : 'false');
      btnPrev.hidden = isStatic;
    }
    if (btnNext) {
      btnNext.disabled = isStatic || activeIndex >= getMaxIndex();
      btnNext.setAttribute('aria-disabled', btnNext.disabled ? 'true' : 'false');
      btnNext.hidden = isStatic;
    }
  };

  const updateStatus = () => {
    if (!statusEl || !slides.length) return;
    const perView = getSlidesPerView();
    const start = activeIndex + 1;
    const end = Math.min(slides.length, activeIndex + perView);
    statusEl.textContent = `Showing testimonials ${start} to ${end} of ${slides.length}.`;
  };

  const updateSlideState = () => {
    const perView = getSlidesPerView();
    const featuredIndex = Math.min(slides.length - 1, activeIndex + Math.floor(perView / 2));
    slides.forEach((slide, index) => {
      const isVisible = index >= activeIndex && index < activeIndex + perView;
      const isFeatured = index === featuredIndex;
      slide.classList.toggle('is-visible', isVisible);
      slide.classList.toggle('is-featured', isFeatured);
      slide.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    });
    setButtonState();
    updateStatus();
  };

  const syncIndexFromScroll = () => {
    scrollFrame = 0;
    const step = getStep();
    activeIndex = step ? Math.max(0, Math.min(getMaxIndex(), Math.round(viewport.scrollLeft / step))) : 0;
    updateSlideState();
  };

  const scheduleScrollSync = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(syncIndexFromScroll);
  };

  const scrollToIndex = (nextIndex, behavior) => {
    if (!viewport) return;
    const step = getStep();
    activeIndex = Math.max(0, Math.min(getMaxIndex(), nextIndex));
    const mode = prefersReducedMotion ? 'auto' : (behavior || 'smooth');
    viewport.scrollTo({ left: activeIndex * step, behavior: mode });
    if (mode === 'auto') {
      syncIndexFromScroll();
    } else {
      updateSlideState();
    }
  };

  const bindControls = () => {
    if (carousel.dataset.testimonialsInitialized === 'true') return;
    btnPrev?.addEventListener('click', () => scrollToIndex(activeIndex - 1, 'smooth'));
    btnNext?.addEventListener('click', () => scrollToIndex(activeIndex + 1, 'smooth'));

    viewport?.addEventListener('scroll', scheduleScrollSync, { passive: true });
    viewport?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollToIndex(activeIndex - 1, 'smooth');
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollToIndex(activeIndex + 1, 'smooth');
      }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        scrollToIndex(activeIndex, 'auto');
      }, 120);
    }, { passive: true });
    carousel.dataset.testimonialsInitialized = 'true';
  };

  const finalizeCarousel = () => {
    viewport = carousel.querySelector('.testimonials-carousel__viewport');
    slides = Array.from(carousel.querySelectorAll('.testimonials-carousel__slide'));
    statusEl = carousel.querySelector('[data-testimonials-status]');
    if (!viewport || !slides.length) {
      if (controls) controls.hidden = true;
      return;
    }
    activeIndex = 0;
    bindControls();
    scrollToIndex(0, 'auto');
  };

  const initCarousel = (items) => {
    carousel.innerHTML = `
      <div class="testimonials-carousel__viewport" tabindex="0">
        <div class="testimonials-carousel__track" role="list">
          ${items.map((item, index) => `
            <div class="testimonials-carousel__slide" role="listitem" aria-label="Testimonial ${index + 1} of ${items.length}">
              ${renderCard(item)}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="sr-only" aria-live="polite" data-testimonials-status></div>
    `;
    finalizeCarousel();
  };

  const loadTestimonials = async () => {
    if (section?.hidden || section?.getAttribute('aria-hidden') === 'true') return;
    if (carousel.dataset.prerendered === 'true' && carousel.querySelector('.testimonials-carousel__viewport')) {
      finalizeCarousel();
      return;
    }
    try {
      const data = await (window.loadJSON ? window.loadJSON(source) : (await fetch(source)).json());
      if (data && data.enabled === false) {
        if (section) section.hidden = true;
        return;
      }
      if (!data || !Array.isArray(data.items) || data.items.length === 0) {
        if (controls) controls.hidden = true;
        carousel.innerHTML = '<p class="testimonials__fallback">Testimonials are unavailable right now.</p>';
        return;
      }

      initCarousel(data.items);
    } catch (error) {
      console.warn('Testimonials carousel failed to load.', error);
      if (controls) controls.hidden = true;
      carousel.innerHTML = '<p class="testimonials__fallback">Testimonials are unavailable right now.</p>';
    }
  };

  loadTestimonials();
})();
