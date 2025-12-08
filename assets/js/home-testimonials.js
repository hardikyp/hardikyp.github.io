(() => {
  const section = document.querySelector('.testimonials');
  const container = section?.querySelector('.testimonials-list');
  if (!section || !container) return;

  const sanitize = (value) => (value == null ? '' : String(value)).trim();
  const escapeHTML = (str) => sanitize(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const buildMeta = (title, affiliation) => {
    const parts = [title, affiliation]
      .map(sanitize)
      .filter(Boolean)
      .map(escapeHTML);
    return parts.join(' &bull; ');
  };

  const renderCard = (item) => {
    const name = sanitize(item.name) || 'Anonymous';
    const title = buildMeta(item.title, item.affiliation);
    const quote = sanitize(item.quote);
    const photo = sanitize(item.photo) || 'assets/img/portrait.jpg';
    const safeName = escapeHTML(name);
    const safeQuote = escapeHTML(quote);
    const safePhoto = escapeHTML(photo);
    return `
      <article class="testimonial-card">
        <div class="testimonial-card__profile">
          <img class="testimonial-card__photo" src="${safePhoto}" alt="${safeName}" loading="lazy" />
          <div>
            <p class="testimonial-card__name">${safeName}</p>
            ${title ? `<p class="testimonial-card__meta">${title}</p>` : ''}
          </div>
        </div>
        ${quote ? `<blockquote><p>${safeQuote}</p></blockquote>` : ''}
      </article>`;
  };

  const normalizePayload = (payload) => {
    if (Array.isArray(payload)) {
      return { enabled: true, items: payload };
    }
    if (payload && typeof payload === 'object') {
      const enabled = payload.enabled !== false;
      const items = Array.isArray(payload.items) ? payload.items : [];
      return { enabled, items };
    }
    return { enabled: true, items: [] };
  };

  const toggleSection = (enabled) => {
    if (enabled) {
      section.removeAttribute('hidden');
      section.removeAttribute('aria-hidden');
    } else {
      section.setAttribute('hidden', 'true');
      section.setAttribute('aria-hidden', 'true');
    }
  };

  const loadTestimonials = async () => {
    try {
      const data = await (window.loadJSON ? window.loadJSON('assets/data/testimonials.json') : (await fetch('assets/data/testimonials.json')).json());
      const payload = normalizePayload(data);
      toggleSection(payload.enabled);
      if (!payload.enabled) return;

      const entries = payload.items;
      if (!entries.length) {
        container.innerHTML = '<p class="testimonials__fallback">Testimonials will be added soon.</p>';
        return;
      }
      container.innerHTML = entries.map(renderCard).join('');
    } catch (err) {
      console.warn('[home] testimonials failed to load', err);
      toggleSection(true);
      container.innerHTML = '<p class="testimonials__fallback">Testimonials will be added soon.</p>';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTestimonials);
  } else {
    loadTestimonials();
  }
})();
