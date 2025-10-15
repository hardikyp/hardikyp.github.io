(() => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) return;

  const el = {
    title: document.getElementById('viewTitle'),
    tag: document.getElementById('viewTag'),
    date: document.getElementById('viewDate'),
    media: document.getElementById('viewMedia'),
    body: document.getElementById('viewBody')
  };

  const toDateStr = (d) => new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });

  const load = async () => {
    try {
      const res = await fetch('/updates/data/updates.json');
      if (!res.ok) return;
      const j = await res.json();
      const u = (j.updates || []).find(x => x.slug === slug);
      if (!u) {
        el.title.textContent = 'Update not found';
        el.tag.style.display = 'none';
        el.date.style.display = 'none';
        el.body.innerHTML = '<p class="muted">No update matches this link.</p>';
        return;
      }
      // Populate
      el.title.textContent = u.title || 'Update';
      if (u.tag) el.tag.textContent = u.tag; else el.tag.style.display = 'none';
      if (u.date) { el.date.setAttribute('datetime', u.date); el.date.textContent = toDateStr(u.date); } else el.date.style.display = 'none';
      if (u.image && u.image.src) {
        el.media.innerHTML = `<img src="${u.image.src}" alt="${u.image.alt || ''}" loading="lazy" />`;
      }
      if (u.body) {
        el.body.innerHTML = u.body;
      } else if (u.excerpt) {
        el.body.innerHTML = `<p>${u.excerpt}</p>`;
      }
      // Update document title and description if possible
      try {
        document.title = `${u.title} — Updates — Hardik Patil`;
        const md = document.querySelector('meta[name="description"]');
        if (md) md.setAttribute('content', u.meta || u.excerpt || '');
      } catch {}
    } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();

