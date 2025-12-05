(() => {
  const feed = document.querySelector('.updates-feed .update-list');
  if (!feed) return;

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

  const normalize = (u) => ({
    ...u,
    url: u.url || `updates/view.html?slug=${encodeURIComponent(u.slug)}`,
    excerpt: normalizeExcerpt(u)
  });

  const cardHTML = (u) => {
    const formattedDate = toDisplayDate(u.date);
    return `
      <article class="update-card" data-url="${u.url}" role="link" tabindex="0">
        <div class="update-card__header">
          <a class="update-card__logo" href="${u.url}">
            <img src="${u.image?.src || 'assets/img/updates/placeholder.svg'}" alt="${u.image?.alt || ''}" loading="lazy" />
          </a>
          <div class="update-card__heading">
            <h3 class="update-card__title"><a href="${u.url}">${u.title}</a></h3>
            <div class="update-card__meta">
              ${u.tag ? `<span class="update-tag">${u.tag}</span>` : ''}
              ${formattedDate ? `<time datetime="${u.date}">${formattedDate}</time>` : ''}
            </div>
          </div>
        </div>
        <div class="update-card__body">
          ${u.excerpt ? `<p class="update-card__excerpt">${escapeHTML(u.excerpt)}</p>` : ''}
          <a class="btn tertiary" href="${u.url}">Read more</a>
        </div>
      </article>`;
  };

  const bindCardNavigation = () => {
    document.querySelectorAll('.update-card[data-url]').forEach(card => {
      if (card.dataset.cardNav === 'true') return;
      const url = card.dataset.url;
      if (!url) return;
      const shouldIgnore = (event) => event?.target?.closest('a, button');
      const go = (event, forceNewTab = false) => {
        const openInNewTab = forceNewTab || event?.metaKey || event?.ctrlKey;
        if (openInNewTab) {
          window.open(url, '_blank', 'noopener');
        } else {
          window.location.href = url;
        }
      };
      card.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || shouldIgnore(event)) return;
        event.preventDefault();
        go(event);
      });
      card.addEventListener('auxclick', (event) => {
        if (event.defaultPrevented || event.button !== 1 || shouldIgnore(event)) return;
        event.preventDefault();
        go(event, true);
      });
      card.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || shouldIgnore(event)) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          go(event);
        }
      });
      card.dataset.cardNav = 'true';
    });
  };

  const render = (arr) => {
    feed.innerHTML = '';
    arr.forEach(u => { feed.insertAdjacentHTML('beforeend', cardHTML(u)); });
    bindCardNavigation();
  };

  const load = async () => {
    try {
      const j = await (window.loadJSON ? window.loadJSON('updates/data/updates.json') : (await fetch('updates/data/updates.json')).json());
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
