(() => {
  const VISIBLE = 3;
  const CENTER_OFFSET = Math.floor(VISIBLE / 2);

  const section = document.querySelector('.testimonials');
  const viewport = section?.querySelector('.testimonials-viewport');
  const track = section?.querySelector('.testimonials-track');
  const controls = section?.querySelector('.testimonials-controls');
  const prevBtn = controls?.querySelector('.testimonials-nav--prev');
  const nextBtn = controls?.querySelector('.testimonials-nav--next');
  if (!section || !viewport || !track) return;

  const state = {
    count: 0,
    clones: 0,
    index: 0,
    width: 0,
    gap: 0,
    step: 0,
    translate: 0,
    animating: false
  };
  const drag = {
    active: false,
    startX: 0,
    delta: 0,
    pointerId: null,
    base: 0
  };
  let cards = [];

  const sanitize = (value) => (value == null ? '' : String(value)).trim();
  const escapeHTML = (str) => sanitize(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const renderCard = (item, isClone = false) => {
    const name = sanitize(item.name) || 'Anonymous';
    const title = sanitize(item.title);
    const affiliation = sanitize(item.affiliation);
    const quote = sanitize(item.quote);
    const photo = sanitize(item.photo) || 'assets/img/portrait.jpg';
    return `
      <article class="testimonial-card${isClone ? ' testimonial-card--clone' : ''}">
        <div class="testimonial-card__profile">
          <img class="testimonial-card__photo" src="${escapeHTML(photo)}" alt="${escapeHTML(name)}" loading="lazy" />
          <div>
            <p class="testimonial-card__name">${escapeHTML(name)}</p>
            ${title ? `<p class="testimonial-card__meta testimonial-card__title">${escapeHTML(title)}</p>` : ''}
            ${affiliation ? `<p class="testimonial-card__meta testimonial-card__affiliation">${escapeHTML(affiliation)}</p>` : ''}
          </div>
        </div>
        ${quote ? `<blockquote><p>&ldquo;${escapeHTML(quote)}&rdquo;</p></blockquote>` : ''}
      </article>`;
  };

  const normalizePayload = (payload) => {
    if (Array.isArray(payload)) return { enabled: true, items: payload };
    if (payload && typeof payload === 'object') {
      return {
        enabled: payload.enabled !== false,
        items: Array.isArray(payload.items) ? payload.items : []
      };
    }
    return { enabled: true, items: [] };
  };

  const toggleSection = (enabled) => {
    if (enabled) {
      section.removeAttribute('hidden');
      section.removeAttribute('aria-hidden');
    } else {
      section.setAttribute('hidden', 'true');
      section.setAttribute('aria-hidden', 'true');
    }
  };

  const fetchTestimonials = async () => {
    try {
      const data = await (window.loadJSON ? window.loadJSON('assets/data/testimonials.json') : (await fetch('assets/data/testimonials.json')).json());
      const payload = normalizePayload(data);
      toggleSection(payload.enabled);
      if (!payload.enabled) return;
      buildCarousel(payload.items);
    } catch (err) {
      console.warn('[home] testimonials failed to load', err);
      toggleSection(true);
      track.innerHTML = '<p class="testimonials__fallback">Testimonials will be added soon.</p>';
      cards = [];
      updateControls();
    }
  };

  const buildCarousel = (items) => {
    state.count = items.length;
    if (!state.count) {
      track.innerHTML = '<p class="testimonials__fallback">Testimonials will be added soon.</p>';
      cards = [];
      updateControls();
      return;
    }
    state.clones = state.count > 1 ? Math.min(VISIBLE, state.count) : 0;
    const head = items.slice(-state.clones).map(item => ({ data: item, clone: true }));
    const body = items.map(item => ({ data: item, clone: false }));
    const tail = items.slice(0, state.clones).map(item => ({ data: item, clone: true }));
    const slides = [...head, ...body, ...tail];
    track.innerHTML = slides.map(slide => renderCard(slide.data, slide.clone)).join('');
    cards = Array.from(track.querySelectorAll('.testimonial-card'));
    state.index = state.clones ? state.clones : 0;
    updateMetrics(true);
    syncToIndex(false);
    applyActiveState();
    updateControls();
  };

  const updateMetrics = (resetPosition = false) => {
    const sample = cards.find(card => !card.classList.contains('testimonial-card--clone')) || cards[0];
    if (!sample) return;
    const rect = sample.getBoundingClientRect();
    state.width = rect.width;
    const styles = window.getComputedStyle(track);
    state.gap = parseFloat(styles.columnGap || styles.gap || 0);
    state.step = state.width + state.gap;
    if (resetPosition && state.step) syncToIndex(false);
  };

  const setTransform = (value, animate = true) => {
    if (!animate) track.classList.add('testimonials-track--instant');
    else track.classList.remove('testimonials-track--instant');
    track.style.transform = `translateX(${value}px)`;
    state.translate = value;
    if (!animate) requestAnimationFrame(() => track.classList.remove('testimonials-track--instant'));
  };

  const getTargetForIndex = (idx) => {
    const card = cards[idx];
    if (!card) return state.translate || 0;
    const viewportStyles = window.getComputedStyle(viewport);
    const padLeft = parseFloat(viewportStyles.paddingLeft) || 0;
    const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
    const viewportCenter = viewport.clientWidth / 2;
    return viewportCenter - (padLeft + cardCenter);
  };

  const syncToIndex = (animate = true) => {
    const target = getTargetForIndex(state.index);
    setTransform(target, animate);
  };

  const applyActiveState = () => {
    cards.forEach((card, idx) => card.classList.toggle('testimonial-card--active', idx === state.index));
  };

  const shift = (delta) => {
    if (!cards.length || state.animating || state.count <= 1 || !state.step) return;
    state.animating = true;
    state.index += delta;
    syncToIndex(true);
    applyActiveState();
  };

  const normalizeIndex = () => {
    if (!state.count || !state.clones || !state.step) return;
    const min = state.clones;
    const max = state.clones + state.count - 1;
    if (state.index < min) {
      state.index += state.count;
      syncToIndex(false);
      applyActiveState();
    } else if (state.index > max) {
      state.index -= state.count;
      syncToIndex(false);
      applyActiveState();
    }
  };

  const updateControls = () => {
    if (!controls || !prevBtn || !nextBtn) return;
    if (state.count <= 1) {
      controls.style.display = 'none';
    } else {
      controls.style.display = '';
      prevBtn.disabled = false;
      nextBtn.disabled = false;
    }
  };

  const bindButtons = () => {
    prevBtn?.addEventListener('click', () => shift(-1));
    nextBtn?.addEventListener('click', () => shift(1));
  };

  const bindWheel = () => {
    viewport.addEventListener('wheel', (event) => {
      if (state.count <= 1 || !state.step) return;
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;
      event.preventDefault();
      shift(event.deltaX > 0 ? 1 : -1);
    }, { passive: false });
  };

  const bindDrag = () => {
    viewport.addEventListener('pointerdown', (event) => {
      if (state.count <= 1 || !state.step) return;
      drag.active = true;
      drag.startX = event.clientX;
      drag.delta = 0;
      drag.pointerId = event.pointerId;
      drag.base = state.translate;
      track.classList.add('testimonials-track--instant');
      try { viewport.setPointerCapture(event.pointerId); } catch (_) {}
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!drag.active || drag.pointerId !== event.pointerId) return;
      drag.delta = event.clientX - drag.startX;
      track.style.transform = `translateX(${drag.base + drag.delta}px)`;
    });

    const releaseDrag = (event) => {
      if (!drag.active || (event && drag.pointerId !== event.pointerId)) return;
      try { viewport.releasePointerCapture(drag.pointerId); } catch (_) {}
      track.classList.remove('testimonials-track--instant');
      const threshold = state.width * 0.25;
      if (Math.abs(drag.delta) > threshold) {
        setTransform(drag.base + drag.delta, false);
        shift(drag.delta < 0 ? 1 : -1);
      } else {
        syncToIndex(true);
      }
      drag.active = false;
      drag.delta = 0;
    };

    viewport.addEventListener('pointerup', releaseDrag);
    viewport.addEventListener('pointercancel', releaseDrag);
    viewport.addEventListener('pointerleave', (event) => {
      if (drag.active) releaseDrag(event);
    });
  };

  const handleResize = () => {
    window.addEventListener('resize', () => {
      if (!cards.length) return;
      window.clearTimeout(handleResize._t);
      handleResize._t = window.setTimeout(() => {
        updateMetrics(true);
      }, 120);
    }, { passive: true });
  };

  track.addEventListener('transitionend', (event) => {
    if (event.target !== track) return;
    state.animating = false;
    normalizeIndex();
  });

  bindButtons();
  bindWheel();
  bindDrag();
  handleResize();
  fetchTestimonials();
})();
