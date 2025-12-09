(() => {
  const section = document.querySelector('.expertise');
  const grid = section?.querySelector('.expertise__grid');
  if (!section || !grid) return;

  const sanitize = (value) => (value == null ? '' : String(value)).trim();
  const escapeHTML = (str) => sanitize(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const toggleSection = (enabled) => {
    if (enabled) {
      section.removeAttribute('hidden');
      section.removeAttribute('aria-hidden');
    } else {
      section.setAttribute('hidden', 'true');
      section.setAttribute('aria-hidden', 'true');
    }
  };

  const renderCard = (item) => {
    const title = escapeHTML(sanitize(item.title) || 'Focus Area');
    const summary = escapeHTML(sanitize(item.summary));
    return `
      <article class="expertise-card">
        <h3>${title}</h3>
        ${summary ? `<p>${summary}</p>` : ''}
      </article>`;
  };

  const normalize = (payload) => {
    if (Array.isArray(payload)) return { enabled: true, items: payload };
    if (payload && typeof payload === 'object') {
      return {
        enabled: payload.enabled !== false,
        items: Array.isArray(payload.items) ? payload.items : []
      };
    }
    return { enabled: true, items: [] };
  };

  const loadExpertise = async () => {
    try {
      const raw = await (window.loadJSON ? window.loadJSON('assets/data/expertise.json') : (await fetch('assets/data/expertise.json')).json());
      const data = normalize(raw);
      toggleSection(data.enabled);
      if (!data.enabled) return;
      if (!data.items.length) {
        grid.innerHTML = '<p class="expertise__fallback">Focus areas coming soon.</p>';
        return;
      }
      grid.innerHTML = data.items.map(renderCard).join('');
    } catch (err) {
      console.warn('[home] expertise failed to load', err);
      toggleSection(true);
      grid.innerHTML = '<p class="expertise__fallback">Focus areas coming soon.</p>';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadExpertise);
  } else {
    loadExpertise();
  }
})();
