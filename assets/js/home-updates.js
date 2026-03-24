(() => {
  const container = document.querySelector('.updates-preview .update-list');
  if (!container) return;

  const sanitizeWhitespace = (str) => (str || '').replace(/\s+/g, ' ').trim();
  const detailToExcerpt = (html, limit = 220) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const source = tmp.querySelector('p') || tmp;
    const raw = sanitizeWhitespace(source.textContent || tmp.textContent || '');
    if (!raw) return '';
    if (raw.length <= limit) return raw;
    const shortened = raw.slice(0, limit).replace(/\s+\S*$/, '');
    return `${shortened}…`;
  };
  const normalizeExcerpt = (u) => {
    const htmlDetail = u.detail || u.body || '';
    const derived = detailToExcerpt(htmlDetail);
    if (derived) return derived;
    return sanitizeWhitespace(u.excerpt || '');
  };
  const escapeHTML = (str) =>
    (str || '').replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const renderImage = (src, alt, options = {}) => {
    if (window.siteImages?.renderResponsiveImage) {
      return window.siteImages.renderResponsiveImage({ src, alt, ...options });
    }
    return `<img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="${options.loading || 'lazy'}" width="${options.width || ''}" height="${options.height || ''}" />`;
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
    url: u.url || `updates/view.html?slug=${encodeURIComponent(u.slug)}`,
    excerpt: normalizeExcerpt(u)
  });
  const toDisplayDate = (iso) => {
    if (!isISODate(iso)) return '';
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return '';
    const [y, m, d] = parts;
    const local = new Date(y, m - 1, d);
    return Number.isNaN(local.getTime())
      ? ''
      : local.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
        const formatted = toDisplayDate(u.date);
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
