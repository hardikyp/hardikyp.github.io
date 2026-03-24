(() => {
  const manifest = {
  "assets/img/projects/fire-zone-model.jpg": {
    "extension": ".jpg",
    "height": 1800,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 2400
  },
  "assets/img/projects/image-processing.jpg": {
    "extension": ".jpg",
    "height": 1400,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 2106
  },
  "assets/img/projects/radiometer.jpg": {
    "extension": ".jpg",
    "height": 1975,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 2633
  },
  "assets/img/projects/reconfigurable-truss.jpg": {
    "extension": ".jpg",
    "height": 1800,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 2400
  },
  "assets/img/projects/star-tracker.jpg": {
    "extension": ".jpg",
    "height": 1800,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 2400
  },
  "assets/img/projects/torsional-spring.jpg": {
    "extension": ".jpg",
    "height": 727,
    "variants": [
      800
    ],
    "webp": true,
    "width": 969
  },
  "assets/img/projects/traffic-network-opt.jpg": {
    "extension": ".jpg",
    "height": 1800,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 2400
  },
  "assets/img/projects/truss-nonlinear-analysis.jpg": {
    "extension": ".jpg",
    "height": 900,
    "variants": [
      800
    ],
    "webp": true,
    "width": 1200
  },
  "assets/img/projects/water-detection.png": {
    "extension": ".png",
    "height": 1450,
    "variants": [
      800,
      1200
    ],
    "webp": true,
    "width": 1220
  },
  "assets/img/projects/wave-bridge-simulation.jpg": {
    "extension": ".jpg",
    "height": 1046,
    "variants": [
      800,
      1200
    ],
    "webp": true,
    "width": 1393
  },
  "assets/img/projects/website-logo.jpg": {
    "extension": ".jpg",
    "height": 332,
    "variants": [],
    "webp": true,
    "width": 443
  },
  "assets/img/projects/wooden-bridge.jpg": {
    "extension": ".jpg",
    "height": 1800,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 2400
  },
  "assets/img/projects/wordle-deeprl.jpg": {
    "extension": ".jpg",
    "height": 900,
    "variants": [
      800
    ],
    "webp": true,
    "width": 1200
  },
  "assets/img/updates/gallery/emi-2025.jpg": {
    "extension": ".jpg",
    "height": 2000,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 2000
  },
  "assets/img/updates/gallery/tt-internship.jpg": {
    "extension": ".jpg",
    "height": 2048,
    "variants": [
      800,
      1200,
      1600
    ],
    "webp": true,
    "width": 3070
  },
  "assets/img/updates/thumbnails/asme-digital-collection.png": {
    "extension": ".png",
    "height": 72,
    "variants": [],
    "webp": true,
    "width": 72
  },
  "assets/img/updates/thumbnails/elsevier.png": {
    "extension": ".png",
    "height": 150,
    "variants": [
      128
    ],
    "webp": true,
    "width": 150
  },
  "assets/img/updates/thumbnails/emi.png": {
    "extension": ".png",
    "height": 158,
    "variants": [
      128
    ],
    "webp": true,
    "width": 158
  },
  "assets/img/updates/thumbnails/iitb.png": {
    "extension": ".png",
    "height": 320,
    "variants": [
      128,
      256
    ],
    "webp": true,
    "width": 320
  },
  "assets/img/updates/thumbnails/imece.png": {
    "extension": ".png",
    "height": 110,
    "variants": [],
    "webp": true,
    "width": 110
  },
  "assets/img/updates/thumbnails/jlfs-cover.png": {
    "extension": ".png",
    "height": 515,
    "variants": [
      128,
      256,
      512
    ],
    "webp": true,
    "width": 515
  },
  "assets/img/updates/thumbnails/kcmet.png": {
    "extension": ".png",
    "height": 225,
    "variants": [
      128
    ],
    "webp": true,
    "width": 225
  },
  "assets/img/updates/thumbnails/micde.png": {
    "extension": ".png",
    "height": 200,
    "variants": [
      128
    ],
    "webp": true,
    "width": 200
  },
  "assets/img/updates/thumbnails/nsf.jpg": {
    "extension": ".jpg",
    "height": 900,
    "variants": [
      128,
      256,
      512
    ],
    "webp": true,
    "width": 900
  },
  "assets/img/updates/thumbnails/rdifp.png": {
    "extension": ".png",
    "height": 512,
    "variants": [
      128,
      256
    ],
    "webp": true,
    "width": 512
  },
  "assets/img/updates/thumbnails/tt.png": {
    "extension": ".png",
    "height": 200,
    "variants": [
      128
    ],
    "webp": true,
    "width": 200
  },
  "assets/img/updates/thumbnails/uofm.png": {
    "extension": ".png",
    "height": 512,
    "variants": [
      128,
      256
    ],
    "webp": true,
    "width": 512
  },
  "assets/img/user.png": {
    "extension": ".png",
    "height": 512,
    "variants": [
      128,
      256
    ],
    "webp": true,
    "width": 512
  }
};

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const normalizeSrc = (src = '') => {
    if (!src) return '';
    const trimmed = String(src).trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return trimmed
      .replace(/^https?:\/\/[^/]+\//i, '')
      .replace(/^\.\//, '')
      .replace(/^\//, '')
      .replace(/\\/g, '/');
  };

  const isManagedRemote = (src = '') => /^https?:\/\//i.test(src);
  const splitVariant = (src = '') => {
    const normalized = normalizeSrc(src);
    if (!normalized || isManagedRemote(normalized)) {
      return { key: normalized, width: null };
    }
    const match = normalized.match(/^(.*?)(?:-(128|256|320|480|512|640|800|960|1200|1600))?(\.(?:jpe?g|png|webp))$/i);
    if (!match) return { key: normalized, width: null };
    const [, stem, width, ext] = match;
    return {
      key: `${stem}${ext.toLowerCase()}`,
      width: width ? Number(width) : null,
    };
  };

  const withVariant = (src, width, ext) => {
    const normalized = normalizeSrc(src);
    if (!normalized || isManagedRemote(normalized)) return normalized;
    const parsed = splitVariant(normalized);
    if (!parsed.key) return normalized;
    const lastDot = parsed.key.lastIndexOf('.');
    const stem = parsed.key.slice(0, lastDot);
    const suffix = ext || parsed.key.slice(lastDot);
    return `${stem}-${width}${suffix}`;
  };

  const toWebpPath = (src) => {
    const normalized = normalizeSrc(src);
    if (!normalized || isManagedRemote(normalized)) return '';
    const parsed = splitVariant(normalized);
    if (!parsed.key) return '';
    const lastDot = parsed.key.lastIndexOf('.');
    const stem = parsed.key.slice(0, lastDot);
    return `${stem}.webp`;
  };

  const getMeta = (src = '') => {
    const normalized = normalizeSrc(src);
    if (!normalized || isManagedRemote(normalized)) return null;
    const parsed = splitVariant(normalized);
    return manifest[parsed.key] || null;
  };

  const getDimensions = (src = '') => {
    const meta = getMeta(src);
    if (!meta) return null;
    return { width: meta.width, height: meta.height };
  };

  const chooseWidth = (availableWidths, preferredWidth) => {
    if (!Array.isArray(availableWidths) || !availableWidths.length) return null;
    const preferred = Number(preferredWidth) || availableWidths[0];
    const largerOrEqual = availableWidths.filter((width) => width >= preferred);
    if (largerOrEqual.length) return Math.min(...largerOrEqual);
    return Math.max(...availableWidths);
  };

  const getPrimarySrc = (src = '', options = {}) => {
    const normalized = normalizeSrc(src);
    const meta = getMeta(normalized);
    if (!meta) return normalized;
    const format = options.format === 'webp' ? '.webp' : meta.extension;
    const width = chooseWidth(meta.variants, options.preferredWidth);
    if (!width) {
      return options.format === 'webp' && meta.webp ? toWebpPath(normalized) : normalized;
    }
    return withVariant(normalized, width, format);
  };

  const buildSrcset = (src = '', options = {}) => {
    const normalized = normalizeSrc(src);
    const meta = getMeta(normalized);
    if (!meta || !Array.isArray(meta.variants) || !meta.variants.length) return '';
    const format = options.format === 'webp' ? '.webp' : meta.extension;
    return meta.variants.map((width) => `${withVariant(normalized, width, format)} ${width}w`).join(', ');
  };

  const buildAttributeString = (attributes = {}) => Object.entries(attributes)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false)
    .map(([key, value]) => value === true ? key : `${key}="${escapeHtml(value)}"`)
    .join(' ');

  const renderResponsiveImage = (options = {}) => {
    const src = normalizeSrc(options.src || '');
    if (!src) return '';

    const meta = getMeta(src);
    const width = options.width || meta?.width || '';
    const height = options.height || meta?.height || '';
    const imgAttributes = {
      src: getPrimarySrc(src, { preferredWidth: options.preferredWidth }),
      alt: options.alt || '',
      class: options.className || '',
      loading: options.loading || 'lazy',
      decoding: options.decoding || 'async',
      width,
      height,
      sizes: options.sizes || '',
      srcset: buildSrcset(src, { preferredWidth: options.preferredWidth }),
      fetchpriority: options.fetchPriority || '',
    };
    const imgTag = `<img ${buildAttributeString(imgAttributes)} />`;
    if (!meta?.webp) return imgTag;

    const webpSrc = getPrimarySrc(src, { preferredWidth: options.preferredWidth, format: 'webp' });
    const webpSrcset = buildSrcset(src, { preferredWidth: options.preferredWidth, format: 'webp' });
    const sourceAttributes = {
      type: 'image/webp',
      srcset: webpSrcset || webpSrc,
      sizes: options.sizes || '',
    };
    return `<picture><source ${buildAttributeString(sourceAttributes)} />${imgTag}</picture>`;
  };

  window.siteImages = {
    manifest,
    normalizeSrc,
    getMeta,
    getDimensions,
    getPrimarySrc,
    buildSrcset,
    renderResponsiveImage,
  };
})();
