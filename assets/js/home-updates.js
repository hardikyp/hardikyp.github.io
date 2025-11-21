(() => {
  const container = document.querySelector('.updates-preview .update-list');
  if (!container) return;

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
  const normalize = (u) => ({ ...u, url: u.url || `updates/view.html?slug=${encodeURIComponent(u.slug)}` });

  const injectFromUpdates = async () => {
    try {
      const j = await (window.loadJSON ? window.loadJSON('updates/data/updates.json') : (await fetch('updates/data/updates.json')).json());
      const items = (j.updates || [])
        .map(normalize)
        .filter(u => { const e = validate(u); if (e.length) { console.warn('[home] invalid update', u?.slug, e); return false; } return true; })
        .sort((a,b)=> (b.date||'').localeCompare(a.date||''))
        .slice(0,3);
      if (!items.length) return;
      const card = (u) => {
        const formatted = u.date
          ? new Date(u.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          : '';
        return `
          <article class="update-card">
            <div class="update-card__header">
              <a class="update-card__logo" href="${u.url}">
                <img src="${u.image?.src || 'assets/img/updates/placeholder.svg'}" alt="${u.image?.alt || ''}" loading="lazy" />
              </a>
              <div class="update-card__heading">
                <h3 class="update-card__title"><a href="${u.url}">${u.title}</a></h3>
                <div class="update-card__meta">
                  ${u.tag ? `<span class="update-tag">${u.tag}</span>` : ''}
                  ${formatted ? `<time datetime="${u.date}">${formatted}</time>` : ''}
                </div>
              </div>
            </div>
            <div class="update-card__body">
              ${u.excerpt ? `<p class="update-card__excerpt">${u.excerpt}</p>` : ''}
              <a class="btn tertiary" href="${u.url}">Read more</a>
            </div>
          </article>`;
      };
      container.innerHTML = items.map(card).join('');
    } catch (_) {
      // keep fallback if any
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectFromUpdates); else injectFromUpdates();
})();
