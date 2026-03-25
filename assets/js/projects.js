(() => {
  const grid = document.getElementById('projectsGrid');
  const typeBar = document.getElementById('projTypeFilters');
  if (!grid || !typeBar) return;
  const hasPrerenderedCards = grid.dataset.prerendered === 'true' || !!grid.querySelector('.project-card');
  const { escapeHTML } = window.siteUtils.text;
  const { renderImage } = window.siteUtils.image;
  const { createFilterTabs } = window.siteUtils.tabs;

  const sources = [
    { type: 'Research', url: 'projects/data/research.json' },
    { type: 'Course', url: 'projects/data/courses.json' },
    { type: 'Internship', url: 'projects/data/internships.json' },
    { type: 'Other', url: 'projects/data/others.json' }
  ];
  const projectRoute = (slug = '') => `projects/${encodeURIComponent(slug)}/`;

  const cardHTML = (p) => {
    const link = projectRoute(p.slug);
    const yearText = (p.years || '').trim();
    const typeLabel = p.type || '';
    const meta = (typeLabel || yearText)
      ? `<div class="project-card__meta">
          ${typeLabel ? `<span class="project-card__pill">${typeLabel}</span>` : ''}
          ${yearText ? `<span class="project-card__year">${yearText}</span>` : ''}
        </div>`
      : '';
    return `
      <a class="project-card" href="${link}" data-type="${p.type}">
        ${p.card?.image ? `<div class="project-card__media">${renderImage(p.card.image, p.card.alt || '', { loading: 'lazy', sizes: '(min-width: 1024px) 360px, (min-width: 768px) 45vw, 92vw', preferredWidth: 800 })}</div>` : ''}
        <div class="project-card__body">
          <h3 class="project-card__title">${p.title}</h3>
          ${meta}
          ${p.summary ? `<p class="project-card__summary">${p.summary}</p>` : ''}
          <span class="btn tertiary project-card__link">Read more</span>
        </div>
      </a>`;
  };

  const getLatestYear = (years) => {
    if (!years) return 0;
    const matches = String(years).match(/\d{4}/g);
    if (!matches || !matches.length) return 0;
    return Math.max(...matches.map(Number));
  };

  const filterCards = (type) => {
    grid.querySelectorAll('.project-card').forEach(card => {
      const ct = card.getAttribute('data-type');
      card.style.display = (type === 'all' || type === ct) ? '' : 'none';
    });
  };

  const renderTypes = (types) => {
    createFilterTabs({
      root: typeBar,
      values: types,
      onChange: (value) => {
        filterCards(value);
      },
    });
  };

  const initFromPrerendered = () => {
    const types = Array.from(new Set(
      Array.from(grid.querySelectorAll('.project-card[data-type]'))
        .map((card) => (card.getAttribute('data-type') || '').trim())
        .filter(Boolean)
    ));
    renderTypes(types);
    filterCards('all');
  };

  const load = async () => {
    try {
      const results = await Promise.all(sources.map(async s => {
        try {
          const j = await (window.loadJSON ? window.loadJSON(s.url) : (await fetch(s.url)).json());
          return (j.projects||[]).map(p => ({ ...p, type: s.type }));
        } catch { return []; }
      }));
      const items = results
        .flat()
        .sort((a, b) => getLatestYear(b.years) - getLatestYear(a.years));
      const types = sources.map(s=>s.type);
      renderTypes(types);
      grid.innerHTML = items.map(cardHTML).join('');
      filterCards('all');
    } catch {}
  };
  const init = () => {
    if (hasPrerenderedCards) {
      initFromPrerendered();
      return;
    }
    load();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
