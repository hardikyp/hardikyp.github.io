(() => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) return;

  const els = {
    title: document.getElementById('projTitle'),
    type: document.getElementById('projType'),
    year: document.getElementById('projYear'),
    meta: document.getElementById('projMeta'),
    media: document.getElementById('projMedia'),
    content: document.getElementById('projContent')
  };

  const escape = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const setMedia = (images) => {
    if (!els.media) return;
    const items = (images || []).filter(img => img && img.src).slice(0, 2);
    if (!items.length) {
      els.media.innerHTML = '';
      els.media.style.display = 'none';
      els.media.classList.remove('project-media--multi');
      return;
    }
    els.media.classList.toggle('project-media--multi', items.length > 1);
    els.media.style.display = '';
    els.media.innerHTML = items.map((img, index) => {
      const idx = index + 1;
      const captionText = img.caption || img.alt || `Project illustration ${idx}`;
      const caption = `${escape(captionText)}`;
      return `
      <figure class="project-media__item">
        <img src="${escape(img.src)}" alt="${escape(img.alt || '')}" loading="lazy" />
        <figcaption><strong>Fig. ${idx}.</strong> ${caption}</figcaption>
      </figure>
    `; }).join('');
  };

  const sources = [
    { type: 'Research', url: 'projects/data/research.json' },
    { type: 'Course', url: 'projects/data/courses.json' },
    { type: 'Internship', url: 'projects/data/internships.json' },
    { type: 'Other', url: 'projects/data/others.json' }
  ];

  const load = async () => {
    for (const src of sources) {
      try {
        const j = await (window.loadJSON ? window.loadJSON(src.url) : (await fetch(src.url)).json());
        const p = (j.projects||[]).find(x => x.slug === slug);
        if (p) { render({ ...p, type: p.type || src.type }); return; }
      } catch {}
    }
    els.title.textContent = 'Project not found';
    if (els.meta) els.meta.style.display = 'none';
    setMedia();
    els.content.innerHTML = '<p class="muted">No project matches this link.</p>';
  };

  const render = (p) => {
    els.title.textContent = p.title || 'Project';
    const typeLabel = p.type || '';
    const hasType = Boolean(typeLabel);
    const hasYear = Boolean(p.years);
    if (els.type) {
      els.type.textContent = hasType ? typeLabel : '';
      els.type.style.display = hasType ? '' : 'none';
    }
    if (els.year) {
      els.year.textContent = hasYear ? p.years : '';
      els.year.style.display = hasYear ? '' : 'none';
    }
    if (els.meta) {
      els.meta.style.display = (hasType || hasYear) ? '' : 'none';
    }
    setMedia(p.detail?.images || []);
    if (p.detail?.body) {
      els.content.innerHTML = p.detail.body;
    } else if (p.summary) {
      els.content.innerHTML = `<p>${p.summary}</p>`;
    } else {
      els.content.innerHTML = '<p class="muted">This project does not have additional details yet.</p>';
    }
    try { document.title = `${p.title} — Projects — Hardik Patil`; } catch {}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
