(() => {
  const container = document.querySelector('.updates-preview .update-list');
  if (!container) return;
  if (container.dataset.prerendered === 'true' || container.querySelector('.update-card')) return;

  const { escapeHTML, sanitizeWhitespace, htmlToSummary, formatISODate } = window.siteUtils.text;
  const { renderImage } = window.siteUtils.image;
  const normalizeExcerpt = (u) => {
    const htmlDetail = u.detail || u.body || '';
    const derived = htmlToSummary(htmlDetail, 220);
    if (derived) return derived;
    return sanitizeWhitespace(u.excerpt || '');
  };

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
    url: u.url || `updates/${encodeURIComponent(u.slug)}/`,
    excerpt: normalizeExcerpt(u)
  });

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
        const formatted = formatISODate(u.date);
        return `
          <article class="update-card">
            <a class="update-card__link" href="${u.url}">
                <div class="update-card__header">
                <div class="update-card__logo">
                  ${renderImage(u.image?.src || 'assets/img/updates/placeholder.svg', u.image?.alt || '', { loading: 'lazy', width: 64, height: 64, sizes: '64px', preferredWidth: 128 })}
                </div>
                <div class="update-card__heading">
                  <h3 class="update-card__title">${u.title}</h3>
                  <div class="update-card__meta">
                    ${u.tag ? `<span class="update-tag">${u.tag}</span>` : ''}
                    ${formatted ? `<time datetime="${u.date}">${formatted}</time>` : ''}
                  </div>
                </div>
              </div>
              <div class="update-card__body">
                ${u.excerpt ? `<p class="update-card__excerpt">${escapeHTML(u.excerpt)}</p>` : ''}
                <span class="btn tertiary">Read more</span>
              </div>
            </a>
          </article>`;
      };
      container.innerHTML = items.map(card).join('');
    } catch (_) {
      // keep fallback if any
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectFromUpdates); else injectFromUpdates();
})();
