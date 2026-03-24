(() => {
  const hero = document.querySelector('.photo-hero');
  if (!hero) return;

  const carouselHost = hero.querySelector('[data-carousel]');
  const categoryHost = document.querySelector('[data-photo-categories]');
  const storyHost = document.querySelector('[data-photo-stories]');
  const btnPrev = hero.querySelector('[data-carousel-nav="prev"]');
  const btnNext = hero.querySelector('[data-carousel-nav="next"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interval = reduceMotion ? 12000 : 7000;

  let slides = [];
  let index = 0;
  let timerId;
  let rafId;
  let animId;

  // Parallax state (inertia)
  const state = {
    targetX: 0.5,
    targetY: 0.5,
    currentX: 0.5,
    currentY: 0.5,
    active: false
  };

  const defaultData = {
    carousel: [
      { src: 'assets/photography/carousel/sunrise-on-rocky-mountain.jpg', alt: 'Landscape picture from the Lower Antelope Canyon titled Sunrise on the Rocky Mountain', speed: 0.3 },
      { src: 'assets/photography/carousel/mumbai-sealink.jpg', alt: 'Long exposure photograph of Bandra-Worli Sealink, Mumbai at dawn', speed: 0.22 },
      { src: 'assets/photography/carousel/midnight-sky.jpg', alt: 'Tawas Point lighthouse, Michigan under the backdrop of Milkyway and Perseides meteor shower', speed: 0.28 }
    ],
    categories: [
      {
        slug: 'portraits',
        title: 'Portrait Reveries',
        description: 'Intimate studies of expression and the architecture of light—environmental portraits and studio experiments.',
        accent: 'warm',
        cover: 'assets/photography/portraits/cover.jpg',
        gallery: [
          {
            src: 'assets/photography/portraits/cover.jpg',
            alt: 'Portrait lit with magenta and cyan light',
            caption: 'Resonance in Neon — Mumbai, 2024'
          }
        ]
      },
      {
        slug: 'landscapes',
        title: 'Edge of Horizons',
        description: 'Landscapes oscillating between moody dusk and crystalline dawn—a survey of terrain and atmosphere in flux.',
        accent: 'dusk',
        cover: 'assets/photography/carousel/sunrise-on-rocky-mountain.jpg',
        gallery: [
          {
            src: 'assets/photography/carousel/sunrise-on-rocky-mountain.jpg',
            alt: 'Ridge line during monsoon clouds',
            caption: 'Monsoon Ridgeline — Sahyadris, 2023'
          }
        ]
      },
      {
        slug: 'night-stories',
        title: 'Midnight Transit',
        description: 'City veins after dark—neon reflections, kinetic blur, and the conversations between shadows.',
        accent: 'night',
        cover: 'assets/photography/carousel/midnight-sky.jpg',
        gallery: [
          {
            src: 'assets/photography/carousel/midnight-sky.jpg',
            alt: 'Long exposure of city traffic at night',
            caption: 'Echoes of Transit — Ann Arbor, 2022'
          }
        ]
      }
    ],
    stories: [
      {
        slug: 'monsoon-cartography',
        title: 'Monsoon Cartography',
        summary: 'Charting weather patterns across the Western Ghats—a visual atlas of humidity, mist, and waiting.',
        accent: 'dusk',
        cover: 'assets/photography/carousel/hut.jpg',
        meta: { location: 'Sahyadris, India', year: 2023 }
      },
      {
        slug: 'sonic-spectrums',
        title: 'Sonic Spectrums',
        summary: 'Backstage portraiture of independent musicians—translating sound into chroma and motion.',
        accent: 'warm',
        cover: 'assets/photography/stories/sonic-cover.jpg',
        meta: { location: 'Detroit & Ann Arbor', year: 2022 }
      }
    ]
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/photography/data/photos.json', { cache: 'no-cache' });
      if (!res.ok) return defaultData;
      const json = await res.json();
      return { ...defaultData, ...json };
    } catch {
      return defaultData;
    }
  };
  const renderImage = (src, alt, options = {}) => {
    if (window.siteImages?.renderResponsiveImage) {
      return window.siteImages.renderResponsiveImage({ src, alt, ...options });
    }
    const loading = options.loading || 'lazy';
    const decoding = options.decoding || 'async';
    const fetchPriority = options.fetchPriority ? ` fetchpriority="${options.fetchPriority}"` : '';
    return `<img src="${src || ''}" alt="${alt || ''}" loading="${loading}" decoding="${decoding}"${fetchPriority} />`;
  };

  const renderCarousel = (items) => {
    if (!carouselHost) return;
    const markup = (items || []).map((item, i) => {
      const overlay = item.overlay;
      const speed = typeof item.speed === 'number' ? item.speed : 0.25;
      const loading = i === 0 ? 'eager' : 'lazy';
      return `<article class="photo-slide${i === 0 ? ' is-active' : ''}" data-speed="${speed}">
        ${renderImage(item.src, item.alt || '', { loading, decoding: 'async', fetchPriority: i === 0 ? 'high' : '', sizes: '100vw', preferredWidth: 1600 })}
        ${overlay ? `<div class="photo-slide__overlay gradient-${overlay}"></div>` : ''}
      </article>`;
    }).join('');
    carouselHost.innerHTML = markup;
    slides = Array.from(carouselHost.querySelectorAll('.photo-slide'));
    index = 0;
  };

  const categoryCard = (item) => {
    const accent = item.accent || 'warm';
    const galleryCount = (item.gallery || []).length;
    return `<article class="photo-category gradient-${accent} reveal-on-scroll" id="${item.slug || ''}" aria-label="${item.title || 'Gallery'} collection">
      <div class="photo-category__content">
        <h3>${item.title || ''}</h3>
        <p>${item.description || ''}</p>
        ${galleryCount ? `<span class="muted">${galleryCount} image${galleryCount === 1 ? '' : 's'}</span>` : ''}
        <button class="btn tertiary light" type="button" data-gallery="${item.slug || ''}">View series</button>
      </div>
      <div class="photo-category__preview">
        ${renderImage(item.cover, `${item.title || ''} cover`, { loading: 'lazy', decoding: 'async', sizes: '(min-width: 1024px) 40vw, 90vw', preferredWidth: 1200 })}
      </div>
    </article>`;
  };

  const storyCard = (item) => {
    const meta = item.meta ? `<span class="muted">${[item.meta.location, item.meta.year].filter(Boolean).join(' · ')}</span>` : '';
    return `<article class="photo-story reveal-on-scroll" id="${item.slug || ''}">
      <div class="photo-story__media">
        ${renderImage(item.cover, `${item.title || ''} cover`, { loading: 'lazy', decoding: 'async', sizes: '(min-width: 1024px) 45vw, 90vw', preferredWidth: 1200 })}
      </div>
      <div class="photo-story__body">
        <h3>${item.title || ''}</h3>
        <p>${item.summary || ''}</p>
        ${meta}
        <button class="btn secondary light" type="button" data-story="${item.slug || ''}">Read photo essay</button>
      </div>
    </article>`;
  };

  const renderCategories = (items) => {
    if (!categoryHost) return;
    categoryHost.innerHTML = (items || []).map(categoryCard).join('');
  };

  const renderStories = (items) => {
    if (!storyHost) return;
    storyHost.innerHTML = (items || []).map(storyCard).join('');
  };

  const setActive = (nextIndex) => {
    if (!slides.length) return;
    slides[index].classList.remove('is-active');
    slides[index].style.setProperty('--translate-x', '0px');
    slides[index].style.setProperty('--translate-y', '0px');
    slides[index].style.setProperty('--scroll-y', '0px');
    index = (nextIndex + slides.length) % slides.length;
    slides[index].classList.add('is-active');
  };

  const go = (delta) => {
    setActive(index + delta);
    restartTimer();
  };

  const restartTimer = () => {
    if (timerId) clearInterval(timerId);
    if (reduceMotion || slides.length <= 1) return;
    timerId = setInterval(() => setActive(index + 1), interval);
  };

  const applyParallax = (nx, ny) => {
    if (!slides[index]) return;
    const slide = slides[index];
    const speed = parseFloat(slide.dataset.speed || '0.25');

    // Centered normalized coords [-0.5, 0.5]
    const cx = nx - 0.5;
    const cy = ny - 0.5;

    // Translate scales with speed for depth
    const translateX = cx * 140 * speed;
    const translateY = cy * 80 * speed;

    // Subtle tilt (Dogstudio-like feel, but restrained)
    const maxTilt = 10; // degrees
    const rotateY = cx * maxTilt;      // left/right tilt
    const rotateX = -cy * maxTilt * 0.8; // up/down tilt, slightly reduced

    slide.style.setProperty('--translate-x', `${translateX}px`);
    slide.style.setProperty('--translate-y', `${translateY}px`);
    slide.style.setProperty('--rotate-x', `${rotateX}deg`);
    slide.style.setProperty('--rotate-y', `${rotateY}deg`);
  };

  const stepParallax = () => {
    if (!state.active) return;
    // Inertial interpolation
    const ease = 0.750;
    state.currentX += (state.targetX - state.currentX) * ease;
    state.currentY += (state.targetY - state.currentY) * ease;
    applyParallax(state.currentX, state.currentY);
    animId = requestAnimationFrame(stepParallax);
  };

  const handlePointerMove = (event) => {
    if (reduceMotion || !slides.length) return;
    state.targetX = event.clientX / window.innerWidth;
    state.targetY = event.clientY / window.innerHeight;
    if (!state.active) {
      state.active = true;
      if (animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(stepParallax);
    }
  };

  const handlePointerLeave = () => {
    if (reduceMotion || !slides.length) return;
    state.targetX = 0.5;
    state.targetY = 0.5;
    // Let inertia bring it back to center, then stop
    setTimeout(() => {
      state.active = false;
      if (animId) cancelAnimationFrame(animId);
      const slide = slides[index];
      if (!slide) return;
      slide.style.setProperty('--translate-x', '0px');
      slide.style.setProperty('--translate-y', '0px');
      slide.style.setProperty('--rotate-x', '0deg');
      slide.style.setProperty('--rotate-y', '0deg');
    }, 180);
  };

  const observeReveals = () => {
    const revealTargets = document.querySelectorAll('.reveal-on-scroll');
    if (!revealTargets.length) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10%' }
    );
    revealTargets.forEach((el) => observer.observe(el));
  };

  const cleanup = () => {
    hero.removeEventListener('pointermove', handlePointerMove);
    hero.removeEventListener('pointerleave', handlePointerLeave);
    if (timerId) clearInterval(timerId);
    if (rafId) cancelAnimationFrame(rafId);
    if (animId) cancelAnimationFrame(animId);
  };
  window.addEventListener('beforeunload', cleanup, { once: true });

  const initCarouselControls = () => {
    if (btnPrev) {
      btnPrev.addEventListener('click', () => go(-1));
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => go(1));
    }
    hero.addEventListener('pointermove', handlePointerMove);
    hero.addEventListener('pointerleave', handlePointerLeave);
    // disable scroll-based parallax; hero should move as one
    restartTimer();
  };

  const hydrate = async () => {
    const data = await fetchData();
    renderCarousel(data.carousel);
    renderCategories(data.categories);
    renderStories(data.stories);
    setTimeout(observeReveals, 20);
    initCarouselControls();
  };

  hydrate();
})();
