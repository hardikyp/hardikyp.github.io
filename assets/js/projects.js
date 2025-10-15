(() => {
  const grid = document.getElementById('projectsGrid');
  const typeBar = document.getElementById('projTypeFilters');
  if (!grid || !typeBar) return;

  const sources = [
    { type: 'Research', url: '/projects/data/research.json' },
    { type: 'Course', url: '/projects/data/courses.json' },
    { type: 'Internship', url: '/projects/data/internships.json' },
    { type: 'Other', url: '/projects/data/others.json' }
  ];

  const cardHTML = (p) => `
    <a class="project-card" href="/projects/view.html?slug=${encodeURIComponent(p.slug)}" data-type="${p.type}">
      <div class="project-card__media">${p.card?.image ? `<img src="${p.card.image}" alt="${p.card.alt || ''}" loading="lazy"/>` : ''}</div>
      <div class="project-card__title">${p.title}</div>
      <div class="project-card__hover">
        ${p.summary ? `<div class=\"project-card__excerpt\">${p.summary}</div>` : ''}
        <div class="project-card__actions"><span class="btn tertiary">Read more</span></div>
      </div>
    </a>`;

  const renderTypes = (types) => {
    typeBar.innerHTML = '';
    const all = document.createElement('button');
    all.className = 'chip'; all.textContent = 'All';
    all.setAttribute('data-type','all'); all.setAttribute('aria-pressed','true');
    typeBar.appendChild(all);
    types.forEach(t => {
      const b = document.createElement('button');
      b.className = 'chip'; b.textContent = t; b.setAttribute('data-type', t);
      b.setAttribute('aria-pressed','false'); typeBar.appendChild(b);
    });
  };

  const bindTypeChips = () => {
    typeBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip'); if (!btn) return;
      typeBar.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed','false'));
      btn.setAttribute('aria-pressed','true');
      const t = btn.getAttribute('data-type');
      grid.querySelectorAll('.project-card').forEach(card => {
        const ct = card.getAttribute('data-type');
        card.style.display = (t === 'all' || t === ct) ? '' : 'none';
      });
    });
  };

  const load = async () => {
    try {
      const results = await Promise.all(sources.map(async s => {
        try {
          const r = await fetch(s.url); if (!r.ok) return [];
          const j = await r.json();
          return (j.projects||[]).map(p => ({ ...p, type: s.type }));
        } catch { return []; }
      }));
      const items = results.flat();
      const types = sources.map(s=>s.type);
      renderTypes(types);
      grid.innerHTML = items.map(cardHTML).join('');
      bindTypeChips();
    } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
