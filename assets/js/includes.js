// Shared runtime helpers: JSON loading, file-protocol flagging, and active nav links.
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

      var candidates = new Set(['/projects/','/teaching/','/publications/','/updates/','/photography/']);
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

  setActiveLinks();
})();
