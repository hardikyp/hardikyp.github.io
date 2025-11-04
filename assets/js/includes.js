// Synchronously include header/footer partials and set active nav links
(function () {
  // Provide a global JSON loader that works over file: protocol too.
  // Some browsers block fetch() for file URLs; fallback to XHR when needed.
  try {
    if (!window.loadJSON) {
      window.loadJSON = function loadJSON(url) {
        return new Promise(function(resolve, reject) {
          if (location.protocol === 'file:') {
            try {
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, true);
              // Hint MIME for some browsers
              try { xhr.overrideMimeType && xhr.overrideMimeType('application/json'); } catch (e) {}
              xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                  // file:// often reports status 0; treat non-empty response as success
                  var ok = (xhr.status === 200 || xhr.status === 0);
                  if (ok && typeof xhr.responseText === 'string' && xhr.responseText.length) {
                    try { resolve(JSON.parse(xhr.responseText)); }
                    catch (err) { reject(err); }
                  } else {
                    reject(new Error('Failed to load ' + url + ' (status ' + xhr.status + ')'));
                  }
                }
              };
              xhr.onerror = function () { reject(new Error('Network error loading ' + url)); };
              xhr.send();
              return;
            } catch (err) { reject(err); return; }
          }
          // Default path: use fetch over http/https
          fetch(url).then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          }).then(resolve).catch(reject);
        });
      };
    }
  } catch (e) {}
  var isFile = location.protocol === 'file:';
  if (isFile) {
    document.documentElement.classList.add('file-protocol');
  }

  var FALLBACKS = {
    'assets/partials/header.html': `<header id="site-header" class="site-header" role="banner">
  <div class="nav-inner">
    <!-- Left: Logo -->
    <a class="logo" href="index.html" aria-label="Home">
      <span class="icon monogram" aria-hidden="true"></span>
    </a>
    <!-- Center: Nav links (desktop/tablet) -->
    <nav class="primary-nav" aria-label="Primary">
      <ul>
        <li><a href="projects/index.html">Projects</a></li>
        <li><a href="publications/index.html">Publications</a></li>
        <li><a href="updates/index.html">Updates</a></li>
        <li><a href="photography/index.html">Photography</a></li>
      </ul>
    </nav>
    <!-- Right: CTAs -->
    <div class="nav-cta">
      <a class="btn secondary" href="assets/docs/Hardik_Patil_CV.pdf" download>Get CV</a>
      <a class="btn primary" href="index.html#contact">Contact</a>
    </div>
    <!-- Mobile hamburger -->
    <button class="hamburger" id="navToggle" aria-label="Open menu" aria-controls="mobileMenu" aria-expanded="false">
      <span class="icon icon-menu" aria-hidden="true"></span>
      <span class="icon icon-close" aria-hidden="true"></span>
    </button>
  </div>
  <!-- Slide-in mobile menu -->
  <div id="mobileMenu" class="mobile-menu" hidden>
    <div class="menu-header" id="mobileMenuHeader"></div>
    <nav aria-label="Mobile">
      <ul>
        <li><a href="projects/index.html">Projects</a></li>
        <li><a href="publications/index.html">Publications</a></li>
        <li><a href="updates/index.html">Updates</a></li>
        <li><a href="photography/index.html">Photography</a></li>
        <li class="divider"></li>
        <li><a class="btn secondary full" href="assets/docs/Hardik_Patil_CV.pdf" download>Get CV</a></li>
        <li><a class="btn primary full" href="index.html#contact">Contact</a></li>
      </ul>
    </nav>
  </div>
  <div class="menu-overlay" id="menuOverlay" hidden></div>
</header>`,
    'assets/partials/footer.html': `<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <span class="monogram" role="img" aria-label="HP logo"></span>
      <div class="social">
        <a href="https://www.linkedin.com/in/hardikypatil" aria-label="LinkedIn"><span class="icon linkedin" aria-hidden="true"></span></a>
        <a href="https://github.com/hardikyp" aria-label="GitHub"><span class="icon github" aria-hidden="true"></span></a>
        <a href="https://www.instagram.com/_hardikpatil_" aria-label="Instagram"><span class="icon instagram" aria-hidden="true"></span></a>
        <a href="https://www.facebook.com/hardik.patil.520" aria-label="Facebook"><span class="icon facebook" aria-hidden="true"></span></a>
      </div>
    </div>
    <div class="footer-col">
      <h3>Contact</h3>
      <p>Email: <a href="mailto:hardikyp@umich.edu">hardikyp[at]umich.edu</a></p>
      <p>Phone: <a href="tel:+17348821248">+1 (734)-882-1248</a></p>
    </div>
    <div class="footer-col">
      <h3>Location</h3>
      <p>1250 G. G. Brown Laboratories,<br/>2350 Hayward St,<br/>Ann Arbor, MI 48109</p>
    </div>
    <div class="footer-col">
      <h3>Profiles</h3>
      <div class="footer-links">
        <a href="https://www.researchgate.net/profile/Hardik-Patil">Research Gate</a>
        <a href="https://scholar.google.com/citations?user=QxSZzs8AAAAJ&hl=en">Google Scholar</a>
        <a href="https://orcid.org/0009-0006-9191-3738">ORCiD</a>
      </div>
    </div>
    <div class="footer-col">
      <h3>Site</h3>
      <div class="footer-links">
        <a href="projects/index.html">Projects</a>
        <a href="publications/index.html">Publications</a>
        <a href="updates/index.html">Updates</a>
      </div>
    </div>
  </div>
  <div class="copyright">&copy; <span id="year"></span> Hardik Patil. All Rights Reserved.</div>
</footer>`
  };

  function replaceWithFallback(el, url) {
    if (isFile && FALLBACKS[url]) {
      el.outerHTML = FALLBACKS[url];
      return true;
    }
    return false;
  }

  function includePartialsSync() {
    var nodes = document.querySelectorAll('[data-include]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var url = el.getAttribute('data-include');
      if (!url) continue;
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false); // sync
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          // Replace placeholder with fetched markup
          el.outerHTML = xhr.responseText;
        } else if (!replaceWithFallback(el, url)) {
          console.warn('Include failed for', url, xhr.status);
        }
      } catch (e) {
        if (!replaceWithFallback(el, url)) {
          console.warn('Include error for', url, e);
        } else {
          // already replaced
        }
      }
    }
  }

  function setActiveLinks() {
    try {
      var path = location.pathname || '/';
      // Normalize: remove index.html and ensure trailing slash for section roots
      path = path.replace(/index\.html$/i, '');
      if (!path.endsWith('/')) {
        // keep deeper paths as-is; we only care about top-level section
        // e.g., /updates/items/emi-paper.html should map to /updates/
      }
      var section = '/';
      var parts = path.split('/').filter(Boolean);
      if (parts.length > 0) section = '/' + parts[0] + '/';

      var candidates = new Set(['/projects/','/publications/','/updates/','/photography/']);
      if (!candidates.has(section)) return; // home or non-section page

      var markActive = function(anchor) {
        if (!anchor) return;
        var href = anchor.getAttribute('href') || '';
        if (!href) return;
        var clean = href.split('#')[0].split('?')[0];
        if (!clean) return;
        if (!clean.startsWith('/')) clean = '/' + clean;
        clean = clean.replace(/index\.html$/i, '').replace(/\/+$/, '/');
        if (clean === '//') clean = '/';
        if (clean === section) {
          anchor.setAttribute('aria-current', 'page');
        }
      };

      // Primary nav + mobile + footer site links
      var anchors = document.querySelectorAll('.primary-nav a, .mobile-menu a, .site-footer .footer-links a');
      for (var i = 0; i < anchors.length; i++) {
        markActive(anchors[i]);
      }
    } catch (_) {}
  }

  // Perform includes immediately (blocking) so subsequent scripts can bind to injected DOM
  includePartialsSync();
  // Then set active indicators
  setActiveLinks();
})();
