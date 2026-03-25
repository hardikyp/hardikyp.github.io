(() => {
  const feed = document.querySelector('.updates-feed .update-list');
  if (!feed) return;

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

  const cardHTML = (u) => {
    const formattedDate = formatISODate(u.date);
    return `
      <article class="update-card" data-url="${u.url}" role="link" tabindex="0">
        <div class="update-card__header">
          <a class="update-card__logo" href="${u.url}">
            ${renderImage(u.image?.src || 'assets/img/updates/placeholder.svg', u.image?.alt || '', { loading: 'lazy', width: 64, height: 64, sizes: '64px', preferredWidth: 128 })}
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
    if (feed.dataset.prerendered === 'true' || feed.querySelector('.update-card')) {
      bindCardNavigation();
      return;
    }
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
