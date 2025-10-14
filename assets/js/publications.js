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
        const open = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
        if (open) body.removeAttribute('hidden'); else body.setAttribute('hidden','');
      });
    });

    // Filters
    const chips = document.querySelectorAll('.pub-filters .chip');
    chips.forEach(ch => ch.addEventListener('click', () => {
      chips.forEach(c => c.setAttribute('aria-pressed','false'));
      ch.setAttribute('aria-pressed','true');
      const f = ch.getAttribute('data-filter');
      app.querySelectorAll('.pub-item').forEach(it => {
        const show = f === 'all' || it.dataset.cat === f;
        it.style.display = show ? '' : 'none';
      });
    }));
  };

  fetch('/publications/publications.json')
    .then(r => r.json())
    .then(j => render(j.publications))
    .catch(() => {
      app.innerHTML = '<p class="muted">Failed to load publications.</p>';
    });
})();
