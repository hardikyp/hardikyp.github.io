(() => {
  const app = document.getElementById('pubApp');
  if (!app) return;

  const filterBar = document.getElementById('pubFilters');
  const { normalizeToken, titleizeToken } = window.siteUtils.taxonomy;
  const { createFilterTabs } = window.siteUtils.tabs;

  const fmtAuthors = (arr) => arr.join(', ');
  const normalizeCat = (val) => normalizeToken(val, 'other');
  const labelForCat = (val) => titleizeToken(val, 'other');

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

  const buildFilterTabs = (categories) => {
    if (!filterBar) return;
    const preferredOrder = ['journal', 'conference', 'talk'];
    const uniqueCats = Array.from(new Set(categories.map(normalizeCat)));
    const ordered = preferredOrder.filter(c => uniqueCats.includes(c));
    uniqueCats.forEach(c => { if (!ordered.includes(c)) ordered.push(c); });
    createFilterTabs({
      root: filterBar,
      values: ordered,
      onChange: (value) => filterByCategory(value),
      getLabel: (value) => labelForCat(value),
    });
  };

  const bindPublicationInteractions = () => {
    const toggleItemState = (item, expand) => {
      if (!item) return;
      const body = item.querySelector('.pub-body');
      const btn = item.querySelector('.pub-toggle');
      if (!body || !btn) return;
      const isOpen = item.classList.contains('open');
      const shouldOpen = typeof expand === 'boolean' ? expand : !isOpen;
      if (shouldOpen === isOpen) return;
      item.classList.toggle('open', shouldOpen);
      btn.setAttribute('aria-expanded', String(shouldOpen));
      if (shouldOpen) {
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
        body.style.maxHeight = `${body.scrollHeight || 0}px`;
        body.style.opacity = '1';
        requestAnimationFrame(() => {
          body.style.maxHeight = '0px';
          body.style.opacity = '0';
        });
        const hideBody = () => {
          body.setAttribute('hidden', '');
          body.removeEventListener('transitionend', hideBody);
        };
        body.addEventListener('transitionend', hideBody);
        setTimeout(() => {
          if (!item.classList.contains('open')) body.setAttribute('hidden', '');
        }, 280);
      }
    };

    app.querySelectorAll('.pub-item').forEach((item) => {
      if (item.dataset.pubBound === 'true') return;
      item.addEventListener('click', (e) => {
        const actionLink = e.target.closest('.pub-actions a');
        if (actionLink) return;
        const interactive = e.target.closest('a, button');
        if (interactive && !interactive.classList.contains('pub-toggle')) return;
        toggleItemState(item);
      });
      item.dataset.pubBound = 'true';
    });
  };

  const byDateDesc = (a, b) => {
    const da = a._sortDate || 0;
    const db = b._sortDate || 0;
    return db - da;
  };

  const annotateSortDate = (pubs) => {
    pubs.forEach((p) => {
      if (p._sortDate) return;
      const dateStr = p.date || (p.year ? String(p.year) : '');
      let sortValue = 0;
      if (dateStr) {
        const parsed = Date.parse(dateStr);
        if (!Number.isNaN(parsed)) sortValue = parsed;
      }
      if (!sortValue && p.year) {
        sortValue = Date.parse(`${p.year}-01-01`) || p.year;
      }
      p._sortDate = sortValue;
    });
  };

  const render = (data) => {
    annotateSortDate(data);
    const categories = Array.from(new Set(data.map(p => normalizeCat(p.type))));
    const byYear = data.reduce((acc, p) => {
      (acc[p.year] ||= []).push(p);
      return acc;
    }, {});
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
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
      const items = byYear[year].slice().sort(byDateDesc);
      items.forEach(p => {
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
            const tier = idx===0?'primary':idx===1?'secondary':'tertiary';
            btn.className = `btn ${tier}`;
            btn.href = a.href;
            btn.textContent = a.label;
            actionsEl.appendChild(btn);
          });
        }
        list.appendChild(item);
      });
      app.appendChild(y);
    });

    bindPublicationInteractions();

    // Filters
    if (filterBar) buildFilterTabs(categories);
    else filterByCategory('all');
  };

  const load = async () => {
    if (app.dataset.prerendered === 'true' || app.querySelector('.pub-item')) {
      bindPublicationInteractions();
      const categories = Array.from(app.querySelectorAll('.pub-item')).map((item) => item.dataset.cat || 'other');
      if (filterBar) buildFilterTabs(categories);
      else filterByCategory('all');
      return;
    }
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
