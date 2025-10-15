// Synchronously include header/footer partials and set active nav links
(function () {
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
        } else {
          console.warn('Include failed for', url, xhr.status);
        }
      } catch (e) {
        console.warn('Include error for', url, e);
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

      var candidates = new Set(['/projects/','/publications/','/updates/','/blog/','/photography/','/hobbies/']);
      if (!candidates.has(section)) return; // home or non-section page

      var markActive = function(anchor) {
        if (!anchor) return;
        var href = anchor.getAttribute('href') || '';
        // Compare only pathname portion
        if (href === section) {
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
