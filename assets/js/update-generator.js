(() => {
  const qs = new URLSearchParams(location.search);
  if (qs.get('admin') !== '1') return;

  const isLocal = /^(localhost|127\.|\[::1\]|.+\.local)$/.test(location.hostname);

  const textToHashHex = async (text) => {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const maybeAuthorize = async () => {
    const cfg = (window.UPDATES_ADMIN_HASH || '').toString();
    // If a hash is configured, require passphrase. If not configured, only allow on localhost.
    if (cfg) {
      const expected = cfg.replace(/^sha256:/i, '').trim().toLowerCase();
      const pass = prompt('Enter admin passphrase');
      if (!pass) return false;
      try {
        const h = await textToHashHex(pass);
        if (h !== expected) { alert('Not authorized'); return false; }
        return true;
      } catch { return false; }
    }
    return isLocal; // no config → only allow locally
  };

  const host = document.querySelector('.updates-feed') || document.body;
  const wrap = document.createElement('section');
  wrap.style.cssText = 'padding:24px 16px; max-width:960px; margin:0 auto; border:1px dashed var(--border); border-radius:12px; background:#fff;';
  wrap.innerHTML = `
    <h2 style="margin:0 0 12px">New Update Generator</h2>
    <p class="muted" style="margin:0 0 16px">Fill the fields and copy the generated JSON entry and item page HTML. Save the JSON entry into <code>updates/data/updates.json</code> and create <code>updates/items/&lt;slug&gt;.html</code> with the HTML output.</p>
    <form id="uForm" class="contact-form" style="display:grid; gap:10px; grid-template-columns:1fr 1fr;">
      <label class="full"><span>Title</span><input name="title" required /></label>
      <label><span>Tag</span>
        <select name="tag">
          <option>Award</option>
          <option>Publication</option>
          <option>Milestone</option>
          <option>Other</option>
        </select>
      </label>
      <label><span>Date</span><input name="date" type="date" required /></label>
      <label><span>Slug</span><input name="slug" placeholder="my-update" required /></label>
      <label class="full"><span>Excerpt</span><input name="excerpt" /></label>
      <label class="full"><span>Image URL</span><input name="imgsrc" value="/assets/img/updates/" /></label>
      <label class="full"><span>Image Alt</span><input name="imgalt" /></label>
      <label class="full"><span>Meta Description</span><input name="metadesc" /></label>
      <label class="full"><span>Body HTML (optional)</span><textarea name="body" rows="6" placeholder="<p>Body content...</p>"></textarea></label>
      <div class="full" style="display:flex; gap:8px; margin-top:6px;"><button class="btn primary" type="submit">Generate</button><button class="btn secondary" type="button" id="copyAll">Copy JSON</button></div>
    </form>
    <div id="uOut" style="display:grid; gap:12px; margin-top:16px;">
      <div>
        <h3 style="margin:0 0 6px; font-size:1rem;">JSON Entry</h3>
        <textarea id="jsonOut" rows="10" style="width:100%;"></textarea>
      </div>
      <div>
        <h3 style="margin:0 0 6px; font-size:1rem;">Item Page HTML (updates/items/&lt;slug&gt;.html)</h3>
        <textarea id="htmlOut" rows="16" style="width:100%;"></textarea>
      </div>
    </div>
  `;
  // Gate rendering behind authorization
  maybeAuthorize().then(ok => {
    if (!ok) return;
    host.parentNode.insertBefore(wrap, host);

    const form = wrap.querySelector('#uForm');
    const jsonOut = wrap.querySelector('#jsonOut');
    const htmlOut = wrap.querySelector('#htmlOut');
    const copyBtn = wrap.querySelector('#copyAll');

  const tplHTML = (d) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${d.title} — Updates — Hardik Patil</title>
    <meta name="description" content="${d.metadesc || d.excerpt || ''}" />
    <link rel="canonical" href="/updates/items/${d.slug}.html" />
    <link rel="stylesheet" href="/assets/css/style.css" />
    <meta property="og:type" content="article" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <div data-include="/assets/partials/header.html"></div>

    <main id="main" tabindex="-1" class="page">
      <section class="hero hero--update">
        <div class="update-detail__meta">
          <span class="update-tag">${d.tag}</span>
          <time datetime="${d.date}">${new Date(d.date).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}</time>
        </div>
        <h1>${d.title}</h1>
      </section>
      <article class="update-detail">
        <div class="update-detail__media">
          <img src="${d.image.src}" alt="${d.image.alt || ''}" loading="lazy" />
        </div>
        ${d.body || `<p>${d.excerpt || ''}</p>`}
        <a class="btn tertiary" href="/updates/">Back to updates</a>
      </article>
    </main>

    <div data-include="/assets/partials/footer.html"></div>
    <script src="/assets/js/includes.js"></script>
    <script src="/assets/js/main.js" defer></script>
  </body>
</html>`;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const d = {
      slug: (fd.get('slug')||'').toString().trim(),
      title: (fd.get('title')||'').toString().trim(),
      tag: (fd.get('tag')||'Other').toString().trim(),
      date: (fd.get('date')||'').toString().trim(),
      excerpt: (fd.get('excerpt')||'').toString().trim(),
      image: { src: (fd.get('imgsrc')||'').toString().trim(), alt: (fd.get('imgalt')||'').toString().trim() },
      url: ''
    };
    d.url = `/updates/items/${d.slug}.html`;
    const metadesc = (fd.get('metadesc')||'').toString().trim();
    const body = (fd.get('body')||'').toString();

    // JSON block
    const obj = { slug: d.slug, title: d.title, tag: d.tag, date: d.date, excerpt: d.excerpt, image: d.image, url: d.url };
    jsonOut.value = JSON.stringify(obj, null, 2);

    // HTML page
    htmlOut.value = tplHTML({ ...d, metadesc, body });
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(jsonOut.value);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy JSON'), 1200);
    } catch {}
  });
  });
})();
