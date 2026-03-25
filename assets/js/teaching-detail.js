(() => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const { htmlToSummary } = window.siteUtils.text;
  const { renderImage } = window.siteUtils.image;
  const { toAbsoluteUrl, setMeta, setLink, setStructuredData } = window.siteUtils.head;

  const els = {
    title: document.getElementById('teachTitle'),
    metaPill: document.getElementById('teachMetaPill'),
    metaYear: document.getElementById('teachMetaYear'),
    meta: document.getElementById('teachMeta'),
    media: document.getElementById('teachMedia'),
    body: document.getElementById('teachBody')
  };

  if (!els.title || !els.metaPill || !els.metaYear || !els.meta || !els.media || !els.body) return;
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
