(() => {
  const BASE_URL = 'https://hardikpatil.com/';
  const SITE_NAME = 'Hardik Patil';
  const DEFAULT_SOCIAL_IMAGE = `${BASE_URL}assets/img/portrait-1200.jpg`;
  const DEFAULT_SOCIAL_IMAGE_ALT = 'Portrait of Hardik Patil';
  const DETAIL_ROUTE_META = {
    updates: {
      label: 'Updates',
      path: 'updates/',
      itemLabel: 'Update',
      fallbackDescription: 'Updates and announcements from Hardik Patil.',
    },
    projects: {
      label: 'Projects',
      path: 'projects/',
      itemLabel: 'Project',
      fallbackDescription: 'Project details from Hardik Patil.',
    },
    teaching: {
      label: 'Teaching',
      path: 'teaching/',
      itemLabel: 'Course',
      fallbackDescription: 'Teaching details from Hardik Patil.',
    },
  };

  const escapeHTML = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const sanitizeWhitespace = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

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

  const formatISODate = (iso) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const [year, month, day] = iso.split('-').map(Number);
    const local = new Date(year, month - 1, day);
    return Number.isNaN(local.getTime())
      ? ''
      : local.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toAbsoluteUrl = (url = '', base = BASE_URL) => {
    if (!url) return base;
    try {
      return new URL(url, base).toString();
    } catch {
      return base;
    }
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

  const setStructuredData = (data, id = 'structuredData') => {
    if (!data) return;
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement('script');
      node.id = id;
      node.type = 'application/ld+json';
      document.head.appendChild(node);
    }
    node.textContent = JSON.stringify(data);
  };

  const siteReference = () => ({
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": BASE_URL,
  });

  const breadcrumbList = (sectionKey, itemName, itemUrl) => {
    const section = DETAIL_ROUTE_META[sectionKey];
    if (!section || !itemName || !itemUrl) return null;
    return {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": section.label, "item": toAbsoluteUrl(section.path) },
        { "@type": "ListItem", "position": 3, "name": itemName, "item": itemUrl },
      ],
    };
  };

  const applyPageMetadata = ({
    pageTitle,
    description,
    canonicalUrl,
    imageUrl = DEFAULT_SOCIAL_IMAGE,
    imageAlt = DEFAULT_SOCIAL_IMAGE_ALT,
    ogType = 'website',
    robots = 'index,follow',
    structuredData,
  }) => {
    if (pageTitle) document.title = pageTitle;
    if (description) setMeta('name', 'description', description);
    if (robots) setMeta('name', 'robots', robots);
    if (canonicalUrl) setLink('canonical', canonicalUrl);

    setMeta('property', 'og:type', ogType);
    if (pageTitle) setMeta('property', 'og:title', pageTitle);
    if (description) setMeta('property', 'og:description', description);
    if (canonicalUrl) setMeta('property', 'og:url', canonicalUrl);
    if (imageUrl) setMeta('property', 'og:image', imageUrl);
    if (imageAlt) setMeta('property', 'og:image:alt', imageAlt);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', 'en_US');

    setMeta('name', 'twitter:card', 'summary_large_image');
    if (pageTitle) setMeta('name', 'twitter:title', pageTitle);
    if (description) setMeta('name', 'twitter:description', description);
    if (imageUrl) setMeta('name', 'twitter:image', imageUrl);
    if (imageAlt) setMeta('name', 'twitter:image:alt', imageAlt);

    if (structuredData) setStructuredData(structuredData);
  };

  const applyDetailPageMetadata = ({
    sectionKey,
    itemTitle,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt,
    structuredData,
  }) => {
    const section = DETAIL_ROUTE_META[sectionKey];
    if (!section) return;
    applyPageMetadata({
      pageTitle: `${itemTitle || section.itemLabel} — ${section.label} — ${SITE_NAME}`,
      description: description || section.fallbackDescription,
      canonicalUrl: canonicalUrl || toAbsoluteUrl(section.path),
      imageUrl: imageUrl || DEFAULT_SOCIAL_IMAGE,
      imageAlt: imageAlt || itemTitle || DEFAULT_SOCIAL_IMAGE_ALT,
      ogType: 'article',
      structuredData,
    });
  };

  const applyUnavailableDetailMetadata = (sectionKey) => {
    const section = DETAIL_ROUTE_META[sectionKey];
    if (!section) return;
    setMeta('name', 'robots', 'noindex,follow');
    setLink('canonical', toAbsoluteUrl(section.path));
  };

  const renderImage = (src, alt, options = {}) => {
    if (window.siteImages?.renderResponsiveImage) {
      return window.siteImages.renderResponsiveImage({ src, alt, ...options });
    }

    const attrs = {
      src,
      alt,
      loading: options.loading || 'lazy',
    };
    if (options.decoding) attrs.decoding = options.decoding;
    if (options.className) attrs.class = options.className;
    if (options.width) attrs.width = options.width;
    if (options.height) attrs.height = options.height;
    if (options.sizes) attrs.sizes = options.sizes;
    if (options.fetchPriority) attrs.fetchpriority = options.fetchPriority;

    const attrString = Object.entries(attrs)
      .filter(([, value]) => value !== '' && value != null)
      .map(([key, value]) => `${key}="${escapeHTML(value)}"`)
      .join(' ');
    return `<img ${attrString} />`;
  };

  const normalizeToken = (value, fallback = 'other') => {
    const normalized = sanitizeWhitespace(value).toLowerCase();
    return normalized || fallback;
  };

  const titleizeToken = (value, fallback = 'other') =>
    normalizeToken(value, fallback).replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  const createFilterTabs = ({
    root,
    values = [],
    onChange,
    allLabel = 'All',
    allValue = 'all',
    defaultValue = 'all',
    getValue = (value) => value,
    getLabel = (value) => value,
  }) => {
    if (!root) return null;

    const resolvedValues = Array.from(new Set(
      values
        .map((value) => getValue(value))
        .filter((value) => value != null && value !== '')
    ));

    root.innerHTML = '';

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'pub-filters__tabs';
    tabsContainer.setAttribute('role', 'tablist');

    const underlineEl = document.createElement('span');
    underlineEl.className = 'pub-filters__underline';
    underlineEl.setAttribute('aria-hidden', 'true');

    const tabs = [];

    const createTab = (label, value, selected = false) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pub-filters__tab';
      button.textContent = label;
      button.setAttribute('role', 'tab');
      button.setAttribute('data-filter', value);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.setAttribute('tabindex', selected ? '0' : '-1');
      tabs.push(button);
      return button;
    };

    tabsContainer.appendChild(createTab(allLabel, allValue, defaultValue === allValue));
    resolvedValues.forEach((value) => {
      tabsContainer.appendChild(createTab(getLabel(value), value, defaultValue === value));
    });
    tabsContainer.appendChild(underlineEl);
    root.appendChild(tabsContainer);

    let activeTab = tabs.find((tab) => tab.getAttribute('data-filter') === defaultValue) || tabs[0];

    const moveUnderline = (tab) => {
      if (!tab) return;
      underlineEl.style.setProperty('--underline-offset', `${tab.offsetLeft}px`);
      underlineEl.style.setProperty('--underline-width', `${tab.offsetWidth}px`);
    };

    const activateTab = (tab, notify = true) => {
      if (!tab) return;
      if (activeTab && activeTab !== tab) {
        activeTab.setAttribute('aria-selected', 'false');
        activeTab.setAttribute('tabindex', '-1');
      }
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      activeTab = tab;
      requestAnimationFrame(() => moveUnderline(tab));
      if (notify && typeof onChange === 'function') {
        onChange(tab.getAttribute('data-filter') || allValue, tab);
      }
    };

    tabsContainer.addEventListener('click', (event) => {
      const tab = event.target.closest('.pub-filters__tab');
      if (!tab || tab === activeTab) return;
      activateTab(tab, true);
    });

    tabsContainer.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const current = document.activeElement && document.activeElement.closest('.pub-filters__tab');
      const currentIndex = tabs.indexOf(current);
      if (currentIndex === -1) return;
      let nextIndex = currentIndex;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      const nextTab = tabs[nextIndex];
      if (!nextTab) return;
      event.preventDefault();
      nextTab.focus();
      if (nextTab !== activeTab) activateTab(nextTab, true);
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => moveUnderline(activeTab), 120);
    }, { passive: true });

    activateTab(activeTab, true);

    return {
      root: tabsContainer,
      activate(value) {
        const target = tabs.find((tab) => tab.getAttribute('data-filter') === value);
        if (target) activateTab(target, true);
      },
      getActiveValue() {
        return activeTab?.getAttribute('data-filter') || allValue;
      },
    };
  };

  const runWhenVisible = (element, callback, options = {}) => {
    if (!element || typeof callback !== 'function') return () => {};
    const {
      root = null,
      rootMargin = '200px 0px',
      threshold = 0,
      once = true,
    } = options;

    if (!('IntersectionObserver' in window)) {
      callback();
      return () => {};
    }

    let done = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (done) return;
        if (once && !entry.isIntersecting) return;
        callback(entry);
        if (once && entry.isIntersecting) {
          done = true;
          observer.disconnect();
        }
      });
    }, { root, rootMargin, threshold });

    observer.observe(element);
    return () => observer.disconnect();
  };

  const runWhenIdle = (callback, timeout = 1200) => {
    if (typeof callback !== 'function') return () => {};
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(callback, { timeout });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(callback, 0);
    return () => window.clearTimeout(id);
  };

  window.siteUtils = {
    ...window.siteUtils,
    text: {
      escapeHTML,
      sanitizeWhitespace,
      htmlToSummary,
      formatISODate,
    },
    image: {
      renderImage,
    },
    head: {
      BASE_URL,
      toAbsoluteUrl,
      setMeta,
      setLink,
      setStructuredData,
      applyPageMetadata,
      applyDetailPageMetadata,
      applyUnavailableDetailMetadata,
      breadcrumbList,
      siteReference,
      detailRoutes: DETAIL_ROUTE_META,
      defaults: {
        siteName: SITE_NAME,
        socialImage: DEFAULT_SOCIAL_IMAGE,
        socialImageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
      },
    },
    tabs: {
      createFilterTabs,
    },
    lazy: {
      runWhenVisible,
      runWhenIdle,
    },
    taxonomy: {
      normalizeToken,
      titleizeToken,
    },
  };
})();
