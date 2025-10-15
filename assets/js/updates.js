(() => {
  const feed = document.querySelector('.updates-feed .update-list');
  if (!feed) return;

  const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  const validTag = (t) => !t || ['Award','Publication','Milestone','Other'].includes(t);
  const validate = (u) => {
    const errs = [];
    if (!u || typeof u !== 'object') { errs.push('not an object'); return errs; }
    if (!u.slug || typeof u.slug !== 'string') errs.push('missing slug');
    if (!u.title || typeof u.title !== 'string') errs.push('missing title');
    if (u.tag && !validTag(u.tag)) errs.push('invalid tag');
    if (!isISODate(u.date)) errs.push('invalid date (YYYY-MM-DD)');
    if (!u.image || typeof u.image.src !== 'string') errs.push('missing image.src');
    return errs;
  };

  const normalize = (u) => ({
    ...u,
    url: u.url || `/updates/view.html?slug=${encodeURIComponent(u.slug)}`
  });

  const cardHTML = (u) => `
    <article class="update-card">
      <a class="update-card__media" href="${u.url}">
        <img src="${u.image?.src || '/assets/img/updates/placeholder.svg'}" alt="${u.image?.alt || ''}" loading="lazy" />
      </a>
      <div class="update-card__content">
        <h3 class="update-card__title"><a href="${u.url}">${u.title}</a></h3>
        <div class="update-card__meta">
          ${u.tag ? `<span class="update-tag">${u.tag}</span>` : ''}
          ${u.date ? `<time datetime="${u.date}">${new Date(u.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>` : ''}
        </div>
        ${u.excerpt ? `<p class="update-card__excerpt">${u.excerpt}</p>` : ''}
        <a class="btn tertiary" href="${u.url}">Read more</a>
      </div>
    </article>`;

  const render = (arr) => {
    feed.innerHTML = '';
    arr.forEach(u => { feed.insertAdjacentHTML('beforeend', cardHTML(u)); });
  };

  const load = async () => {
    try {
      const res = await fetch('/updates/data/updates.json');
      if (!res.ok) return;
      const j = await res.json();
      const items = (j.updates || [])
        .map(normalize)
        .filter(u => {
          const errs = validate(u);
          if (errs.length) { console.warn('[updates] invalid item', u?.slug, errs); return false; }
          return true;
        })
        .sort((a,b) => (b.date||'').localeCompare(a.date||''));
      render(items);
    } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
