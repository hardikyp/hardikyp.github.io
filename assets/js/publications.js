(() => {
  const app = document.getElementById('pubApp');
  if (!app) return;

  const fmtAuthors = (arr) => arr.join(', ');

  const render = (data) => {
    // Group by year desc
    const byYear = data.reduce((acc, p) => {
      (acc[p.year] ||= []).push(p); return acc;
    }, {});
    const years = Object.keys(byYear).map(Number).sort((a,b)=>b-a);
    app.innerHTML = '';
    years.forEach(year => {
      const y = document.createElement('section');
      y.innerHTML = `<h2 class="pub-year">${year}</h2><div class="pub-list"></div>`;
      const list = y.querySelector('.pub-list');
      byYear[year].forEach(p => {
        const item = document.createElement('article');
        item.className = 'pub-item';
        item.dataset.cat = p.type || 'other';
        const title = `${fmtAuthors(p.authors)}. ${p.status ? `(${p.status.replace('-', ' ')}, ${year})` : `(${year})`} ${p.title}.`;
        const venueLine = [p.venue, p.volume && ` ${p.volume}`, p.pages && `, ${p.pages}`].filter(Boolean).join('');
        item.innerHTML = `
          <div class="pub-head">
            <div>
              <div class="pub-title">${title}</div>
              <div class="pub-meta"><span class="tag">${(p.type||'').charAt(0).toUpperCase()+ (p.type||'').slice(1)}</span><span class="muted">${venueLine}</span></div>
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
    const chips = document.querySelectorAll('.pub-filters .chip');
    const updateYearVisibility = () => {
      app.querySelectorAll('section').forEach(sec => {
        const items = sec.querySelectorAll('.pub-item');
        const hasVisible = Array.from(items).some(it => it.style.display !== 'none');
        sec.style.display = hasVisible ? '' : 'none';
      });
    };
    chips.forEach(ch => ch.addEventListener('click', () => {
      chips.forEach(c => c.setAttribute('aria-pressed','false'));
      ch.setAttribute('aria-pressed','true');
      const f = ch.getAttribute('data-filter');
      app.querySelectorAll('.pub-item').forEach(it => {
        const show = f === 'all' || it.dataset.cat === f;
        it.style.display = show ? '' : 'none';
      });
      updateYearVisibility();
    }));
    // Initial ensure years without items are hidden (in case of empty categories)
    updateYearVisibility();
  };

  const load = async () => {
    const sources = [
      { url: '/publications/data/journals.json', fallbackType: 'journal' },
      { url: '/publications/data/conferences.json', fallbackType: 'conference' },
      { url: '/publications/data/talks.json', fallbackType: 'talk' }
    ];
    try {
      const results = await Promise.all(sources.map(async s => {
        const res = await fetch(s.url);
        if (!res.ok) return { publications: [] };
        const j = await res.json();
        j.publications.forEach(p => { if (!p.type) p.type = s.fallbackType; });
        return j;
      }));
      const all = results.flatMap(j => j.publications || []);
      if (!all.length) throw new Error('empty');
      render(all);
    } catch (e) {
      // Back-compat: try single file if present
      try {
        const r = await fetch('/publications/publications.json');
        const j = await r.json();
        render(j.publications || []);
      } catch {
        app.innerHTML = '<p class="muted">Failed to load publications.</p>';
      }
    }
  };
  load();
})();
