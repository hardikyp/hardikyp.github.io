(() => {
  const container = document.querySelector('.updates-preview .update-list');
  if (!container) return;

  const injectFromUpdates = async () => {
    try {
      const res = await fetch('/updates/');
      if (!res.ok) return; // keep fallback
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const cards = Array.from(doc.querySelectorAll('.updates-feed .update-list .update-card')).slice(0, 3);
      if (!cards.length) return;
      container.innerHTML = '';
      cards.forEach(card => container.appendChild(card.cloneNode(true)));
    } catch (_) {
      // swallow; leave fallback content
    }
  };
  // Run after parse
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFromUpdates);
  } else {
    injectFromUpdates();
  }
})();

