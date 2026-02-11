(() => {
  const sanitizeWhitespace = (str) => (str || '').replace(/\s+/g, ' ').trim();
  const detailToSummary = (html, limit = 180) => {
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

  const el = {
    title: document.getElementById('viewTitle'),
    tag: document.getElementById('viewTag'),
    date: document.getElementById('viewDate'),
    body: document.getElementById('viewBody')
  };

  const BASE_URL = 'https://hardikpatil.com/';
  const toAbsoluteUrl = (url = '') => {
    if (!url) return BASE_URL;
    try { return new URL(url, BASE_URL).toString(); } catch { return BASE_URL; }
  };
  const setMeta = (attr, key, value) => {
    if (!value) return;
    let node = document.querySelector(`meta[${attr}="${key}"]`);
    if (!node) {
      node = document.createElement('meta');
      node.setAttribute(attr, key);
      document.head.appendChild(node);
    }
    node.setAttribute('content', value);
  };
  const setLink = (rel, href) => {
    if (!href) return;
    let node = document.querySelector(`link[rel="${rel}"]`);
    if (!node) {
      node = document.createElement('link');
      node.setAttribute('rel', rel);
      document.head.appendChild(node);
    }
    node.setAttribute('href', href);
  };
  const setStructuredData = (data) => {
    if (!data) return;
    let node = document.getElementById('structuredData');
    if (!node) {
      node = document.createElement('script');
      node.id = 'structuredData';
      node.type = 'application/ld+json';
      document.head.appendChild(node);
    }
    node.textContent = JSON.stringify(data);
  };

  const buildSrcset = (src) => {
    if (!src || !/\\.(jpe?g)$/i.test(src)) return '';
    const withSize = (w) => src.replace(/\\.(jpe?g)$/i, `-${w}.$1`);
    return [800, 1200, 1600].map(w => `${withSize(w)} ${w}w`).join(', ');
  };

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) {
    setMeta('name', 'robots', 'noindex,follow');
    setLink('canonical', toAbsoluteUrl('updates/'));
    return;
  }

  const toDateStr = (iso) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const [y, m, d] = iso.split('-').map(Number);
    const local = new Date(y, m - 1, d);
    return Number.isNaN(local.getTime())
      ? ''
      : local.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
  };

  const load = async () => {
    try {
      const j = await (window.loadJSON ? window.loadJSON('updates/data/updates.json') : (await fetch('updates/data/updates.json')).json());
      const u = (j.updates || []).find(x => x.slug === slug);
      if (!u) {
        el.title.textContent = 'Update not found';
        el.tag.style.display = 'none';
        el.date.style.display = 'none';
        el.body.innerHTML = '<p class="muted">No update matches this link.</p>';
        setMeta('name', 'robots', 'noindex,follow');
        setLink('canonical', toAbsoluteUrl('updates/'));
        return;
      }
      // Populate
      el.title.textContent = u.title || 'Update';
      if (u.tag) el.tag.textContent = u.tag; else el.tag.style.display = 'none';
      if (u.date) {
        el.date.setAttribute('datetime', u.date);
        const displayDate = toDateStr(u.date);
        if (displayDate) el.date.textContent = displayDate; else el.date.style.display = 'none';
      } else {
        el.date.style.display = 'none';
      }
      const detailHTML = u.detail || u.body || '';
      if (detailHTML) {
        el.body.innerHTML = detailHTML;
      } else {
        el.body.innerHTML = '<p class="muted">Additional details will be posted soon.</p>';
      }
      if (Array.isArray(u.gallery) && u.gallery.length) {
        const galleryItems = u.gallery
          .map((g) => {
            if (!g) return '';
            if (typeof g === 'string') {
              const srcset = buildSrcset(g);
              const sizes = '(min-width: 1024px) 720px, 92vw';
              return `<figure class="update-gallery__item" role="listitem"><img src="${g}" alt="" loading="lazy"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ''} /></figure>`;
            }
            if (!g.src) return '';
            const caption = g.caption || '';
            const srcset = buildSrcset(g.src);
            const sizes = '(min-width: 1024px) 720px, 92vw';
            return `<figure class="update-gallery__item" role="listitem">
              <img src="${g.src}" alt="${g.alt || ''}" loading="lazy"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ''} />
              ${caption ? `<figcaption class="update-gallery__caption">${caption}</figcaption>` : ''}
            </figure>`;
          })
          .join('');
        if (galleryItems.trim()) {
          el.body.insertAdjacentHTML(
            'afterbegin',
            `<div class="update-gallery" role="list">${galleryItems}</div>`
          );
        }
      }
      // Update document title and description if possible
      try {
        const summary = detailToSummary(detailHTML);
        const pageTitle = `${u.title || 'Update'} — Updates — Hardik Patil`;
        const desc = u.meta || summary || 'Updates and announcements from Hardik Patil.';
        const canonicalUrl = toAbsoluteUrl(`updates/view.html?slug=${encodeURIComponent(u.slug)}`);
        const imageUrl = toAbsoluteUrl(u.image?.src || 'assets/img/portrait-1200.jpg');
        const imageAlt = u.image?.alt || u.title || 'Hardik Patil update';
        document.title = pageTitle;
        setMeta('name', 'description', desc);
        setMeta('property', 'og:title', pageTitle);
        setMeta('property', 'og:description', desc);
        setMeta('property', 'og:url', canonicalUrl);
        setMeta('property', 'og:image', imageUrl);
        setMeta('property', 'og:image:alt', imageAlt);
        setMeta('property', 'og:type', 'article');
        setMeta('name', 'twitter:title', pageTitle);
        setMeta('name', 'twitter:description', desc);
        setMeta('name', 'twitter:image', imageUrl);
        setMeta('name', 'twitter:image:alt', imageAlt);
        setLink('canonical', canonicalUrl);
        setStructuredData({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": u.title || 'Update',
          "description": desc,
          "datePublished": u.date || undefined,
          "dateModified": u.date || undefined,
          "author": {
            "@type": "Person",
            "name": "Hardik Patil"
          },
          "image": imageUrl,
          "isPartOf": {
            "@type": "WebSite",
            "name": "Hardik Patil",
            "url": "https://hardikpatil.com/"
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://hardikpatil.com/" },
              { "@type": "ListItem", "position": 2, "name": "Updates", "item": "https://hardikpatil.com/updates/" },
              { "@type": "ListItem", "position": 3, "name": u.title || 'Update', "item": canonicalUrl }
            ]
          },
          "mainEntityOfPage": canonicalUrl
        });
      } catch {}
    } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
