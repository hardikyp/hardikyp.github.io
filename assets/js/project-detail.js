(() => {
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
  const sanitizeWhitespace = (str) => (str || '').replace(/\s+/g, ' ').trim();
  const htmlToSummary = (html, limit = 180) => {
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

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) {
    setMeta('name', 'robots', 'noindex,follow');
    setLink('canonical', toAbsoluteUrl('projects/'));
    return;
  }

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
  const renderImage = (src, alt, options = {}) => {
    if (window.siteImages?.renderResponsiveImage) {
      return window.siteImages.renderResponsiveImage({ src, alt, ...options });
    }
    return `<img src="${escape(src)}" alt="${escape(alt)}" loading="${options.loading || 'lazy'}" />`;
  };

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
    const sizes = items.length > 1 ? '(min-width: 1024px) 42vw, 92vw' : '(min-width: 1024px) 720px, 92vw';
    els.media.innerHTML = items.map((img, index) => {
      const idx = index + 1;
      const captionText = img.caption || img.alt || `Project illustration ${idx}`;
      const caption = `${escape(captionText)}`;
      return `
      <figure class="project-media__item">
        ${renderImage(img.src, img.alt || '', { loading: index === 0 ? 'eager' : 'lazy', sizes, preferredWidth: 1200, fetchPriority: index === 0 ? 'high' : '' })}
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
    setMeta('name', 'robots', 'noindex,follow');
    setLink('canonical', toAbsoluteUrl('projects/'));
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
    try {
      const bodySummary = htmlToSummary(p.detail?.body || '');
      const desc = p.summary || bodySummary || 'Project details from Hardik Patil.';
      const pageTitle = `${p.title || 'Project'} — Projects — Hardik Patil`;
      const canonicalUrl = toAbsoluteUrl(`projects/view.html?slug=${encodeURIComponent(p.slug)}`);
      const imageSrc = p.detail?.images?.[0]?.src || p.card?.image || 'assets/img/portrait-1200.jpg';
      const imageAlt = p.detail?.images?.[0]?.alt || p.card?.alt || p.title || 'Hardik Patil project';
      const imageUrl = toAbsoluteUrl(imageSrc);
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
        "@type": "CreativeWork",
        "name": p.title || 'Project',
        "description": desc,
        "author": {
          "@type": "Person",
          "name": "Hardik Patil"
        },
        "dateCreated": p.years || undefined,
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
            { "@type": "ListItem", "position": 2, "name": "Projects", "item": "https://hardikpatil.com/projects/" },
            { "@type": "ListItem", "position": 3, "name": p.title || 'Project', "item": canonicalUrl }
          ]
        },
        "mainEntityOfPage": canonicalUrl
      });
    } catch {}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
