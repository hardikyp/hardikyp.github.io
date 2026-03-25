(() => {
  const titleEl = document.getElementById('teachingTitle');
  const subtitleEl = document.getElementById('teachingSubtitle');
  const philosophyTitleEl = document.getElementById('philosophyTitle');
  const philosophyHeadlineEl = document.getElementById('philosophyHeadline');
  const philosophyPrinciplesEl = document.getElementById('philosophyPrinciples');
  const philosophyOutcomeEl = document.getElementById('philosophyOutcome');
  const philosophyMediaEl = document.getElementById('philosophyMedia');
  const philosophyImageEl = document.getElementById('philosophyImage');
  const philosophyPlaceholderEl = document.getElementById('philosophyPlaceholder');
  const filtersEl = document.getElementById('teachingFilters');
  const cardsEl = document.getElementById('teachingCards');

  if (!titleEl || !subtitleEl || !philosophyTitleEl || !philosophyHeadlineEl || !philosophyPrinciplesEl || !philosophyOutcomeEl || !philosophyMediaEl || !philosophyImageEl || !philosophyPlaceholderEl || !cardsEl || !filtersEl) return;

  const DATA_URL = 'teaching/data/teaching.json';
  const { escapeHTML: escapeHtml } = window.siteUtils.text;
  const { renderImage } = window.siteUtils.image;
  const { createFilterTabs } = window.siteUtils.tabs;
  const teachingRoute = (slug = '') => `teaching/${encodeURIComponent(slug)}/`;

  const cardHTML = (item) => {
    const slug = item.slug || '';
    const href = teachingRoute(slug);
    const summary = item.card?.summary || '';
    const image = item.card?.image || '';
    const alt = item.card?.alt || '';
    const courseNumber = item.courseNumber || '';
    const courseTitle = item.courseTitle || '';
    const university = item.university || '';
    const year = item.year || '';

    const title = [courseNumber, courseTitle].filter(Boolean).join(' - ');

    return `
      <a class="project-card teaching-card" href="${escapeHtml(href)}" data-university="${escapeHtml(university)}">
        <div class="project-card__media teaching-card__media${image ? ' has-image' : ''}">
          ${image
            ? renderImage(image, alt, { loading: 'lazy', sizes: '(min-width: 1024px) 360px, (min-width: 768px) 45vw, 92vw', preferredWidth: 800 })
            : '<div class="teaching-card__placeholder">Course image placeholder</div>'}
        </div>
        <div class="project-card__body teaching-card__body">
          <h3 class="project-card__title teaching-card__title">${escapeHtml(title || 'Course')}</h3>
          <p class="teaching-card__meta-line">
            ${university ? `<span class="project-card__pill teaching-card__pill">${escapeHtml(university)}</span>` : ''}
            ${(university && year) ? '<span class="teaching-card__sep" aria-hidden="true">•</span>' : ''}
            ${year ? `<span class="project-card__year teaching-card__year">${escapeHtml(year)}</span>` : ''}
          </p>
          ${summary ? `<p class="project-card__summary teaching-card__summary">${escapeHtml(summary)}</p>` : ''}
        </div>
      </a>`;
  };

  const renderCards = (items) => {
    if (!items.length) {
      cardsEl.innerHTML = '<p class="teaching-empty">No courses match this filter.</p>';
      return;
    }
    cardsEl.innerHTML = items.map(cardHTML).join('');
  };

  const buildFilters = (universities, onFilter) => createFilterTabs({
    root: filtersEl,
    values: universities,
    onChange: (value) => onFilter(value),
  });

  const initFromPrerendered = () => {
    const cards = Array.from(cardsEl.querySelectorAll('.teaching-card'));
    if (!cards.length) return;
    const universities = Array.from(new Set(
      cards
        .map((card) => (card.getAttribute('data-university') || '').trim())
        .filter(Boolean)
    ));
    buildFilters(universities, (value) => {
      let visibleCount = 0;
      cards.forEach((card) => {
        const university = (card.getAttribute('data-university') || '').trim();
        const show = value === 'all' || university === value;
        card.style.display = show ? '' : 'none';
        if (show) visibleCount += 1;
      });
      const empty = cardsEl.querySelector('.teaching-empty');
      if (empty) empty.remove();
      if (!visibleCount) {
        cardsEl.insertAdjacentHTML('beforeend', '<p class="teaching-empty">No courses match this filter.</p>');
      }
    });
  };

  const render = (data) => {
    const hero = data.hero || {};
    const philosophy = data.philosophy || {};
    const experiences = Array.isArray(data.experiences) ? data.experiences : [];

    if (hero.title) titleEl.textContent = hero.title;
    if (hero.subtitle) subtitleEl.textContent = hero.subtitle;
    if (philosophy.title) philosophyTitleEl.textContent = philosophy.title;
    philosophyHeadlineEl.textContent = philosophy.headline || philosophy.body || '';
    philosophyOutcomeEl.textContent = philosophy.outcomeLine || '';
    const imageSrc = (philosophy.image?.src || '').trim();
    if (imageSrc) {
      philosophyMediaEl.classList.add('has-image');
      const helper = window.siteImages;
      const meta = helper?.getDimensions?.(imageSrc);
      philosophyImageEl.src = helper?.getPrimarySrc?.(imageSrc, { preferredWidth: 800 }) || imageSrc;
      const srcset = helper?.buildSrcset?.(imageSrc) || '';
      if (srcset) {
        philosophyImageEl.srcset = srcset;
        philosophyImageEl.sizes = '(min-width: 1024px) 32vw, 92vw';
      } else {
        philosophyImageEl.removeAttribute('srcset');
        philosophyImageEl.removeAttribute('sizes');
      }
      if (meta) {
        philosophyImageEl.width = meta.width;
        philosophyImageEl.height = meta.height;
      }
      philosophyImageEl.alt = philosophy.image?.alt || 'Teaching presentation photo';
      philosophyImageEl.hidden = false;
      philosophyPlaceholderEl.hidden = true;
    } else {
      philosophyMediaEl.classList.remove('has-image');
      philosophyImageEl.removeAttribute('src');
      philosophyImageEl.removeAttribute('srcset');
      philosophyImageEl.removeAttribute('sizes');
      philosophyImageEl.hidden = true;
      philosophyPlaceholderEl.hidden = false;
    }
    if (Array.isArray(philosophy.principles) && philosophy.principles.length) {
      philosophyPrinciplesEl.innerHTML = philosophy.principles
        .map((item) => `<span class="teaching-philosophy__chip">${escapeHtml(item)}</span>`)
        .join('');
    } else {
      philosophyPrinciplesEl.innerHTML = '';
    }

    if (!experiences.length) {
      cardsEl.innerHTML = '<p class="teaching-empty">Teaching entries will be added soon.</p>';
      return;
    }

    const courses = experiences.filter((item) => item && item.slug);
    const universities = Array.from(new Set(courses.map((item) => (item.university || '').trim()).filter(Boolean)));
    buildFilters(universities, (value) => {
      if (value === 'all') {
        renderCards(courses);
        return;
      }
      renderCards(courses.filter((item) => (item.university || '').trim() === value));
    });
  };

  const load = async () => {
    if (cardsEl.dataset.prerendered === 'true' || cardsEl.querySelector('.teaching-card')) {
      initFromPrerendered();
      return;
    }
    try {
      const data = await (window.loadJSON ? window.loadJSON(DATA_URL) : (await fetch(DATA_URL)).json());
      render(data || {});
    } catch (_) {
      cardsEl.innerHTML = '<p class="teaching-empty">Teaching entries are unavailable right now.</p>';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
