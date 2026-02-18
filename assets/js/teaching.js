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

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const cardHTML = (item) => {
    const slug = item.slug || '';
    const href = `teaching/view.html?slug=${encodeURIComponent(slug)}`;
    const summary = item.card?.summary || '';
    const image = item.card?.image || '';
    const alt = item.card?.alt || '';
    const courseNumber = item.courseNumber || '';
    const courseTitle = item.courseTitle || '';
    const university = item.university || '';
    const year = item.year || '';

    const title = [courseNumber, courseTitle].filter(Boolean).join(' - ');

    return `
      <a class="project-card teaching-card" href="${escapeHtml(href)}">
        <div class="project-card__media teaching-card__media${image ? ' has-image' : ''}">
          ${image
            ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy" />`
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

  const buildFilters = (items) => {
    const universities = Array.from(new Set(items.map((item) => (item.university || '').trim()).filter(Boolean)));
    filtersEl.innerHTML = '';

    const tabs = document.createElement('div');
    tabs.className = 'pub-filters__tabs';
    tabs.setAttribute('role', 'tablist');

    const createTab = (label, value, selected = false) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pub-filters__tab';
      button.textContent = label;
      button.setAttribute('role', 'tab');
      button.setAttribute('data-filter', value);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.setAttribute('tabindex', selected ? '0' : '-1');
      return button;
    };

    const allTab = createTab('All', 'all', true);
    tabs.appendChild(allTab);
    universities.forEach((name) => tabs.appendChild(createTab(name, name)));

    const underlineEl = document.createElement('span');
    underlineEl.className = 'pub-filters__underline';
    underlineEl.setAttribute('aria-hidden', 'true');
    tabs.appendChild(underlineEl);
    filtersEl.appendChild(tabs);

    let activeTab = allTab;
    const moveUnderline = (tab) => {
      if (!tab) return;
      underlineEl.style.setProperty('--underline-offset', `${tab.offsetLeft}px`);
      underlineEl.style.setProperty('--underline-width', `${tab.offsetWidth}px`);
    };

    const setActiveTab = (tab) => {
      if (!tab) return;
      if (activeTab && activeTab !== tab) {
        activeTab.setAttribute('aria-selected', 'false');
        activeTab.setAttribute('tabindex', '-1');
      }
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      activeTab = tab;
      requestAnimationFrame(() => moveUnderline(tab));
    };

    const applyFilter = (value) => {
      if (value === 'all') {
        renderCards(items);
        return;
      }
      renderCards(items.filter((item) => (item.university || '').trim() === value));
    };

    tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('.pub-filters__tab');
      if (!tab || tab === activeTab) return;
      setActiveTab(tab);
      applyFilter(tab.getAttribute('data-filter') || 'all');
    });

    setActiveTab(allTab);
    applyFilter('all');

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => moveUnderline(activeTab), 120);
    }, { passive: true });
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
      philosophyImageEl.src = imageSrc;
      philosophyImageEl.alt = philosophy.image?.alt || 'Teaching presentation photo';
      philosophyImageEl.hidden = false;
      philosophyPlaceholderEl.hidden = true;
    } else {
      philosophyMediaEl.classList.remove('has-image');
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
    buildFilters(courses);
  };

  const load = async () => {
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
