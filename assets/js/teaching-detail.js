(() => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');

  const els = {
    title: document.getElementById('teachTitle'),
    metaPill: document.getElementById('teachMetaPill'),
    metaYear: document.getElementById('teachMetaYear'),
    meta: document.getElementById('teachMeta'),
    media: document.getElementById('teachMedia'),
    body: document.getElementById('teachBody')
  };

  if (!els.title || !els.metaPill || !els.metaYear || !els.meta || !els.media || !els.body) return;

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

  if (!slug) {
    els.title.textContent = 'Course not found';
    els.meta.style.display = 'none';
    els.media.style.display = 'none';
    els.body.innerHTML = '<p class="muted">No course matches this link.</p>';
    setMeta('name', 'robots', 'noindex,follow');
    setLink('canonical', toAbsoluteUrl('teaching/'));
    return;
  }

  const load = async () => {
    try {
      const data = await (window.loadJSON ? window.loadJSON('teaching/data/teaching.json') : (await fetch('teaching/data/teaching.json')).json());
      const item = (data.experiences || []).find((x) => x.slug === slug);

      if (!item) {
        els.title.textContent = 'Course not found';
        els.meta.style.display = 'none';
        els.media.style.display = 'none';
        els.body.innerHTML = '<p class="muted">No course matches this link.</p>';
        setMeta('name', 'robots', 'noindex,follow');
        setLink('canonical', toAbsoluteUrl('teaching/'));
        return;
      }

      const title = `${item.courseNumber || ''}: ${item.courseTitle || 'Course'}`.replace(/^\s*:\s*/, '');
      const year = item.year || '';
      const university = item.university || '';
      const image = item.card?.image || '';
      const imageAlt = item.card?.alt || title;
      const bodyHtml = item.detail?.body || '<p class="muted">Additional details will be posted soon.</p>';

      els.title.textContent = title;
      els.metaPill.textContent = university;
      els.metaPill.style.display = university ? '' : 'none';
      els.metaYear.textContent = year;
      els.metaYear.style.display = year ? '' : 'none';
      els.meta.style.display = (university || year) ? '' : 'none';

      if (image) {
        els.media.style.display = '';
        els.media.innerHTML = renderImage(image, imageAlt, {
          loading: 'lazy',
          sizes: '(min-width: 1024px) 720px, 92vw',
          preferredWidth: 1200
        });
      } else {
        els.media.style.display = 'none';
        els.media.innerHTML = '';
      }

      els.body.innerHTML = bodyHtml;

      const description = item.card?.summary || htmlToSummary(bodyHtml) || 'Teaching details from Hardik Patil.';
      const pageTitle = `${title} — Teaching — Hardik Patil`;
      const canonicalUrl = toAbsoluteUrl(`teaching/${encodeURIComponent(item.slug)}/`);
      const ogImage = toAbsoluteUrl(image || 'assets/img/portrait-1200.jpg');

      document.title = pageTitle;
      setMeta('name', 'description', description);
      setMeta('property', 'og:title', pageTitle);
      setMeta('property', 'og:description', description);
      setMeta('property', 'og:url', canonicalUrl);
      setMeta('property', 'og:image', ogImage);
      setMeta('property', 'og:image:alt', imageAlt);
      setMeta('name', 'twitter:title', pageTitle);
      setMeta('name', 'twitter:description', description);
      setMeta('name', 'twitter:image', ogImage);
      setMeta('name', 'twitter:image:alt', imageAlt);
      setLink('canonical', canonicalUrl);
      setStructuredData({
        "@context": "https://schema.org",
        "@type": "Course",
        "name": title || 'Course',
        "description": description,
        "provider": {
          "@type": "CollegeOrUniversity",
          "name": university || 'University of Michigan'
        },
        "isPartOf": {
          "@type": "WebSite",
          "name": "Hardik Patil",
          "url": "https://hardikpatil.com/"
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://hardikpatil.com/" },
            { "@type": "ListItem", "position": 2, "name": "Teaching", "item": "https://hardikpatil.com/teaching/" },
            { "@type": "ListItem", "position": 3, "name": title || 'Course', "item": canonicalUrl }
          ]
        },
        "mainEntityOfPage": canonicalUrl
      });
    } catch {
      els.title.textContent = 'Course unavailable';
      els.meta.style.display = 'none';
      els.media.style.display = 'none';
      els.body.innerHTML = '<p class="muted">Course details are unavailable right now.</p>';
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
