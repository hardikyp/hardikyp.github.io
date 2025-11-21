(() => {
  const app = document.getElementById('pubApp');
  if (!app) return;

  const filterBar = document.getElementById('pubFilters');
  let tabsContainer;
  let underlineEl;
  let activeTab;
  let resizeTimer;
  let resizeBound = false;

  const fmtAuthors = (arr) => arr.join(', ');
  const normalizeCat = (val) => (val || 'other').toLowerCase();
  const labelForCat = (val) => normalizeCat(val).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const updateYearVisibility = () => {
    app.querySelectorAll('section').forEach(sec => {
      const items = sec.querySelectorAll('.pub-item');
      const hasVisible = Array.from(items).some(it => it.style.display !== 'none');
      sec.style.display = hasVisible ? '' : 'none';
    });
  };

  const filterByCategory = (filter) => {
    app.querySelectorAll('.pub-item').forEach(it => {
      const cat = it.dataset.cat;
      const show = filter === 'all' || filter === cat;
      it.style.display = show ? '' : 'none';
    });
    updateYearVisibility();
  };

  const moveUnderline = (tab) => {
    if (!underlineEl || !tab) return;
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

  const activateTab = (tab) => {
    if (!tab) return;
    setActiveTab(tab);
    filterByCategory(tab.getAttribute('data-filter') || 'all');
  };

  const buildFilterTabs = (categories) => {
    if (!filterBar) return;
    const preferredOrder = ['journal', 'conference', 'talk'];
    const uniqueCats = Array.from(new Set(categories.map(normalizeCat)));
    const ordered = preferredOrder.filter(c => uniqueCats.includes(c));
    uniqueCats.forEach(c => { if (!ordered.includes(c)) ordered.push(c); });

    filterBar.innerHTML = '';
    tabsContainer = document.createElement('div');
    tabsContainer.className = 'pub-filters__tabs';
    tabsContainer.setAttribute('role', 'tablist');

    const createTab = (label, value, selected = false) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pub-filters__tab';
      btn.textContent = label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-filter', value);
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      btn.setAttribute('tabindex', selected ? '0' : '-1');
      return btn;
    };

    const allTab = createTab('All', 'all', true);
    tabsContainer.appendChild(allTab);
    ordered.forEach(cat => tabsContainer.appendChild(createTab(labelForCat(cat), cat)));

    underlineEl = document.createElement('span');
    underlineEl.className = 'pub-filters__underline';
    underlineEl.setAttribute('aria-hidden', 'true');
    tabsContainer.appendChild(underlineEl);
    filterBar.appendChild(tabsContainer);

    tabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.pub-filters__tab');
      if (!tab || tab === activeTab) return;
      activateTab(tab);
    });
    tabsContainer.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const tabs = Array.from(tabsContainer.querySelectorAll('.pub-filters__tab'));
      const current = document.activeElement && document.activeElement.closest('.pub-filters__tab');
      const idx = tabs.indexOf(current);
      if (idx === -1) return;
      let nextIdx = idx;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
      if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') nextIdx = 0;
      if (e.key === 'End') nextIdx = tabs.length - 1;
      const nextTab = tabs[nextIdx];
      if (nextTab) {
        e.preventDefault();
        nextTab.focus();
        if (nextTab !== activeTab) activateTab(nextTab);
      }
    });

    if (!resizeBound) {
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => moveUnderline(activeTab), 120);
      }, { passive: true });
      resizeBound = true;
    }

    activateTab(allTab);
  };

  const render = (data) => {
    const categories = Array.from(new Set(data.map(p => normalizeCat(p.type))));
    // Group by year desc
    const byYear = data.reduce((acc, p) => {
      (acc[p.year] ||= []).push(p); return acc;
    }, {});
    const years = Object.keys(byYear).map(Number).sort((a,b)=>b-a);
    app.innerHTML = '';
    years.forEach(year => {
      const y = document.createElement('section');
      const heading = document.createElement('h2');
      heading.className = 'pub-year';
      heading.textContent = year;
      const list = document.createElement('div');
      list.className = 'pub-list';
      y.appendChild(heading);
      y.appendChild(list);
      byYear[year].forEach(p => {
        const cat = normalizeCat(p.type);
        const item = document.createElement('article');
        item.className = 'pub-item';
        item.dataset.cat = cat;
        const title = `${fmtAuthors(p.authors)}. ${p.status ? `(${p.status.replace('-', ' ')}, ${year})` : `(${year})`} ${p.title}.`;
        const venueLine = [p.venue, p.volume && ` ${p.volume}`, p.pages && `, ${p.pages}`].filter(Boolean).join('');
        item.innerHTML = `
          <div class="pub-head">
            <div>
              <div class="pub-title">${title}</div>
              <div class="pub-meta"><span class="tag">${labelForCat(cat)}</span><span class="muted">${venueLine}</span></div>
            </div>
            <button class="pub-toggle" aria-expanded="false" aria-label="Toggle details"></button>
          </div>
          <div class="pub-body" hidden>
            ${p.abstract ? `<div class="pub-abstract"><p><b>Abstract:</b> ${p.abstract}</p>${p.keywords ? `<p class="pub-keys"><b>Keywords:</b> ${p.keywords.join('; ')}</p>`: ''}</div>` : ''}
            <div class="pub-actions">
              ${p.links?.doi ? `<a class="btn tertiary" href="${p.links.doi}">DOI</a>`:''}
              ${p.links?.pdf ? `<a class="btn secondary" href="${p.links.pdf}">PDF</a>`:''}
              ${p.links?.slides ? `<a class="btn tertiary" href="${p.links.slides}">Slides</a>`:''}
              ${p.links?.video ? `<a class="btn tertiary" href="${p.links.video}">Video</a>`:''}
              ${p.links?.preprint ? `<a class="btn tertiary" href="${p.links.preprint}">Preprint</a>`:''}
              ${p.links?.code ? `<a class="btn tertiary" href="${p.links.code}">Code</a>`:''}
            </div>
          </div>`;
        // Rebuild actions so first=primary, second=secondary, others (including last)=tertiary
        const actionsEl = item.querySelector('.pub-actions');
        if (actionsEl) {
          actionsEl.innerHTML = '';
          const order = ['doi','pdf','preprint','slides','video','code','event','site'];
          const labels = { doi:'DOI', pdf:'PDF', preprint:'Preprint', slides:'Slides', video:'Video', code:'Code', event:'Event', site:'Site' };
          const actions = [];
          if (p.links) order.forEach(k => { if (p.links[k]) actions.push({href:p.links[k], label:labels[k]||k}); });
          actions.forEach((a, idx) => {
            const btn = document.createElement('a');
            btn.className = `btn ${idx===0?'primary':idx===1?'secondary':'tertiary'}`;
            btn.href = a.href; btn.textContent = a.label;
            actionsEl.appendChild(btn);
          });
        }
        list.appendChild(item);
      });
      app.appendChild(y);
    });

    // Toggle
    app.querySelectorAll('.pub-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.pub-item');
        const body = item.querySelector('.pub-body');
        const isOpening = !item.classList.contains('open');
        item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpening));
        if (isOpening) {
          body.removeAttribute('hidden');
          body.style.maxHeight = '0px';
          body.style.opacity = '0';
          requestAnimationFrame(() => {
            body.style.maxHeight = body.scrollHeight + 'px';
            body.style.opacity = '1';
          });
          const onEnd = (e) => {
            if (e.propertyName === 'max-height') {
              body.style.maxHeight = 'none';
              body.removeEventListener('transitionend', onEnd);
            }
          };
          body.addEventListener('transitionend', onEnd);
        } else {
          // collapse
          body.style.maxHeight = (body.scrollHeight || 0) + 'px';
          body.style.opacity = '1';
          requestAnimationFrame(() => {
            body.style.maxHeight = '0px';
            body.style.opacity = '0';
          });
          setTimeout(() => { body.setAttribute('hidden',''); }, 280);
        }
      });
    });

    // Filters
    if (filterBar) buildFilterTabs(categories);
    else filterByCategory('all');
  };

  const load = async () => {
    const sources = [
      { url: 'publications/data/journals.json', fallbackType: 'journal' },
      { url: 'publications/data/conferences.json', fallbackType: 'conference' },
      { url: 'publications/data/talks.json', fallbackType: 'talk' }
    ];
    try {
      const results = await Promise.all(sources.map(async s => {
        const j = await (window.loadJSON ? window.loadJSON(s.url) : (await fetch(s.url)).json()).catch(() => ({ publications: [] }));
        j.publications.forEach(p => { if (!p.type) p.type = s.fallbackType; });
        return j;
      }));
      const all = results.flatMap(j => j.publications || []);
      if (!all.length) throw new Error('empty');
      render(all);
    } catch (e) {
      // Back-compat: try single file if present
      try {
        const j = await (window.loadJSON ? window.loadJSON('publications/publications.json') : (await fetch('publications/publications.json')).json());
        render(j.publications || []);
      } catch {
        app.innerHTML = '<p class="muted">Failed to load publications.</p>';
      }
    }
  };
  load();
})();
