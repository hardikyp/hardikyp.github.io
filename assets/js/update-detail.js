(() => {
  const { htmlToSummary, formatISODate } = window.siteUtils.text;
  const { renderImage } = window.siteUtils.image;
  const { toAbsoluteUrl, setMeta, setLink, setStructuredData } = window.siteUtils.head;

  const el = {
    title: document.getElementById('viewTitle'),
    tag: document.getElementById('viewTag'),
    date: document.getElementById('viewDate'),
    body: document.getElementById('viewBody')
  };

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) {
    setMeta('name', 'robots', 'noindex,follow');
    setLink('canonical', toAbsoluteUrl('updates/'));
    return;
  }

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
        const displayDate = formatISODate(u.date);
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
            const sizes = '(min-width: 1024px) 720px, 92vw';
            if (!g) return '';
            if (typeof g === 'string') {
              return `<figure class="update-gallery__item" role="listitem">${renderImage(g, '', { loading: 'lazy', sizes, preferredWidth: 1200 })}</figure>`;
            }
            if (!g.src) return '';
            const caption = g.caption || '';
            return `<figure class="update-gallery__item" role="listitem">
              ${renderImage(g.src, g.alt || '', { loading: 'lazy', sizes, preferredWidth: 1200 })}
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
        const summary = htmlToSummary(detailHTML);
        const pageTitle = `${u.title || 'Update'} — Updates — Hardik Patil`;
        const desc = u.meta || summary || 'Updates and announcements from Hardik Patil.';
        const canonicalUrl = toAbsoluteUrl(`updates/${encodeURIComponent(u.slug)}/`);
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
