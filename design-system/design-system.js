(() => {
  if (!document.body.classList.contains('page-design-system')) return;

  const ALLOW_NAV_SELECTOR = '.skip-link, .back-to-top, [data-ds-allow-nav="true"]';

  const disableLinks = () => {
    document.querySelectorAll('a[href]').forEach((anchor) => {
      if (anchor.matches(ALLOW_NAV_SELECTOR)) return;
      if (!anchor.dataset.dsOriginalHref) {
        anchor.dataset.dsOriginalHref = anchor.getAttribute('href') || '';
      }
      anchor.setAttribute('href', '#');
      anchor.setAttribute('data-ds-disabled-link', 'true');
    });
  };

  const bindDisabledLinkGuards = () => {
    const guard = (event) => {
      const anchor = event.target.closest('a[data-ds-disabled-link="true"]');
      if (!anchor) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('click', guard, true);
    document.addEventListener('auxclick', guard, true);
  };

  const preventDemoFormSubmissions = () => {
    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', (event) => event.preventDefault());
    });
  };

  const initTypographySizes = () => {
    const firstFontName = (fontValue = '') => {
      const first = String(fontValue).split(',')[0] || '';
      return first.replace(/["']/g, '').trim() || '--';
    };

    const render = () => {
      document.querySelectorAll('.ds-type-px[data-size-for]').forEach((node) => {
        const targetId = node.getAttribute('data-size-for');
        const target = targetId ? document.getElementById(targetId) : null;
        if (!target) return;
        const px = window.getComputedStyle(target).fontSize;
        node.textContent = px ? `${px}` : '-- px';
      });

      document.querySelectorAll('.ds-type-font[data-font-for]').forEach((node) => {
        const targetId = node.getAttribute('data-font-for');
        const target = targetId ? document.getElementById(targetId) : null;
        if (!target) return;
        const family = window.getComputedStyle(target).fontFamily;
        node.textContent = firstFontName(family);
      });
    };
    render();
    window.addEventListener('resize', render, { passive: true });
  };

  const initFilterTabs = () => {
    document.querySelectorAll('.pub-filters__tabs').forEach((tabsRoot) => {
      const tabs = Array.from(tabsRoot.querySelectorAll('.pub-filters__tab'));
      const underline = tabsRoot.querySelector('.pub-filters__underline');
      if (!tabs.length || !underline) return;

      let activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];

      const moveUnderline = (tab) => {
        if (!tab) return;
        underline.style.setProperty('--underline-offset', `${tab.offsetLeft}px`);
        underline.style.setProperty('--underline-width', `${tab.offsetWidth}px`);
      };

      const setActiveTab = (tab) => {
        if (!tab || tab === activeTab) return;
        activeTab.setAttribute('aria-selected', 'false');
        activeTab.setAttribute('tabindex', '-1');
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        activeTab = tab;
        moveUnderline(tab);
      };

      tabsRoot.addEventListener('click', (event) => {
        const tab = event.target.closest('.pub-filters__tab');
        if (!tab) return;
        setActiveTab(tab);
      });

      tabsRoot.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        const current = event.target.closest('.pub-filters__tab');
        if (!current) return;
        event.preventDefault();
        const index = tabs.indexOf(current);
        if (index < 0) return;
        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        const nextTab = tabs[nextIndex];
        if (!nextTab) return;
        nextTab.focus();
        setActiveTab(nextTab);
      });

      tabs.forEach((tab) => {
        if (tab !== activeTab) {
          tab.setAttribute('aria-selected', 'false');
          tab.setAttribute('tabindex', '-1');
        }
      });
      activeTab.setAttribute('aria-selected', 'true');
      activeTab.setAttribute('tabindex', '0');
      moveUnderline(activeTab);

      window.addEventListener(
        'resize',
        () => {
          moveUnderline(activeTab);
        },
        { passive: true }
      );
    });
  };

  const initPublicationAccordion = () => {
    document.querySelectorAll('.pub-item').forEach((item) => {
      const body = item.querySelector('.pub-body');
      const toggle = item.querySelector('.pub-toggle');
      const head = item.querySelector('.pub-head');
      if (!body || !toggle || !head) return;

      const applyState = (open) => {
        item.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        if (open) {
          body.style.maxHeight = 'none';
          body.style.opacity = '1';
          body.removeAttribute('hidden');
        } else {
          body.style.maxHeight = '0px';
          body.style.opacity = '0';
          body.setAttribute('hidden', '');
        }
      };

      const initialOpen = item.classList.contains('open');
      applyState(initialOpen);

      const onToggle = (event) => {
        const interactive = event.target.closest('a');
        if (interactive) return;
        event.preventDefault();
        applyState(!item.classList.contains('open'));
      };

      toggle.addEventListener('click', onToggle);
      head.addEventListener('click', onToggle);
    });
  };

  const init = () => {
    disableLinks();
    bindDisabledLinkGuards();
    preventDemoFormSubmissions();
    initTypographySizes();
    initFilterTabs();
    initPublicationAccordion();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
