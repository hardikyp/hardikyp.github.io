(() => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) return;

  const els = {
    title: document.getElementById('projTitle'),
    subtitle: document.getElementById('projSubtitle'),
    media: document.getElementById('projMedia'),
    content: document.getElementById('projContent')
  };

  const sources = [
    '/projects/data/research.json',
    '/projects/data/courses.json',
    '/projects/data/internships.json',
    '/projects/data/others.json'
  ];

  const load = async () => {
    for (const url of sources) {
      try {
        const r = await fetch(url); if (!r.ok) continue;
        const j = await r.json();
        const p = (j.projects||[]).find(x => x.slug === slug);
        if (p) { render(p); return; }
      } catch {}
    }
    els.title.textContent = 'Project not found';
    els.subtitle.textContent = '';
    els.content.innerHTML = '<p class="muted">No project matches this link.</p>';
  };

  const render = (p) => {
    els.title.textContent = p.title || 'Project';
    els.subtitle.textContent = [p.type, p.years].filter(Boolean).join(' • ');
    if (p.detail?.images?.length) {
      els.media.innerHTML = p.detail.images.map(img => `<img src="${img.src}" alt="${img.alt||''}" loading="lazy" />`).join('');
    } else if (p.card?.image) {
      els.media.innerHTML = `<img src="${p.card.image}" alt="${p.card.alt||''}" loading="lazy" />`;
    }
    if (p.detail?.body) {
      els.content.innerHTML = p.detail.body;
    } else if (p.abstract) {
      els.content.innerHTML = p.abstract;
    } else if (p.summary) {
      els.content.innerHTML = `<p>${p.summary}</p>`;
    }
    try { document.title = `${p.title} — Projects — Hardik Patil`; } catch {}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();

