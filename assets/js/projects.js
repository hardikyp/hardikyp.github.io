(() => {
  const grid = document.getElementById('projectsGrid');
  const typeBar = document.getElementById('projTypeFilters');
  if (!grid || !typeBar) return;

  const sources = [
    { type: 'Research', url: 'projects/data/research.json' },
    { type: 'Course', url: 'projects/data/courses.json' },
    { type: 'Internship', url: 'projects/data/internships.json' },
    { type: 'Other', url: 'projects/data/others.json' }
  ];

  const cardHTML = (p) => {
    const link = `projects/view.html?slug=${encodeURIComponent(p.slug)}`;
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
        ${p.card?.image ? `<div class="project-card__media"><img src="${p.card.image}" alt="${p.card.alt || ''}" loading="lazy"/></div>` : ''}
        <div class="project-card__body">
          <h3 class="project-card__title">${p.title}</h3>
          ${meta}
          ${p.summary ? `<p class="project-card__summary">${p.summary}</p>` : ''}
          <span class="btn tertiary project-card__link">Read more</span>
        </div>
      </a>`;
  };

  let tabsContainer;
  let underlineEl;
  let activeTab;

  const filterCards = (type) => {
    grid.querySelectorAll('.project-card').forEach(card => {
      const ct = card.getAttribute('data-type');
      card.style.display = (type === 'all' || type === ct) ? '' : 'none';
    });
  };

  const moveUnderline = (tab) => {
    if (!underlineEl || !tab) return;
    underlineEl.style.setProperty('--underline-offset', `${tab.offsetLeft}px`);
    underlineEl.style.setProperty('--underline-width', `${tab.offsetWidth}px`);
  };

  const setActiveTab = (tab) => {
    if (!tab) return;
    if (activeTab && activeTab !== tab) {
      activeTab.setAttribute('aria-selected','false');
      activeTab.setAttribute('tabindex','-1');
    }
    tab.setAttribute('aria-selected','true');
    tab.setAttribute('tabindex','0');
    activeTab = tab;
    requestAnimationFrame(() => moveUnderline(tab));
  };

  const renderTypes = (types) => {
    typeBar.innerHTML = '';
    tabsContainer = document.createElement('div');
    tabsContainer.className = 'pub-filters__tabs';
    tabsContainer.setAttribute('role', 'tablist');

    const createTab = (label, dataType, selected = false) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pub-filters__tab';
      button.textContent = label;
      button.setAttribute('role', 'tab');
      button.setAttribute('data-type', dataType);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.setAttribute('tabindex', selected ? '0' : '-1');
      if (selected) activeTab = button;
      return button;
    };

    const allTab = createTab('All', 'all', true);
    tabsContainer.appendChild(allTab);
    types.forEach(type => tabsContainer.appendChild(createTab(type, type)));

    underlineEl = document.createElement('span');
    underlineEl.className = 'pub-filters__underline';
    underlineEl.setAttribute('aria-hidden', 'true');
    tabsContainer.appendChild(underlineEl);

    typeBar.appendChild(tabsContainer);
    setActiveTab(allTab);
  };

  const bindTypeTabs = () => {
    typeBar.addEventListener('click', (e) => {
      const tab = e.target.closest('.pub-filters__tab');
      if (!tab || tab === activeTab) return;
      setActiveTab(tab);
      filterCards(tab.getAttribute('data-type'));
    });
  };

  const load = async () => {
    try {
      const results = await Promise.all(sources.map(async s => {
        try {
          const j = await (window.loadJSON ? window.loadJSON(s.url) : (await fetch(s.url)).json());
          return (j.projects||[]).map(p => ({ ...p, type: s.type }));
        } catch { return []; }
      }));
      const items = results.flat();
      const types = sources.map(s=>s.type);
      renderTypes(types);
      grid.innerHTML = items.map(cardHTML).join('');
      filterCards('all');
      bindTypeTabs();
      let t;
      window.addEventListener('resize', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          moveUnderline(activeTab);
        }, 120);
      }, { passive: true });
    } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
