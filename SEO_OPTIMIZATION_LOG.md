# SEO + Performance Optimization Log

## 2026-02-04
- Added responsive `srcset` support and LCP prioritization for photography carousel and covers.
- Generated resized image variants for large photography and update gallery images (800/1200/1600 widths).
- Added `width`/`height` and lazy decoding for portrait image and update thumbnails.
- Preloaded main stylesheet on all pages for faster first paint.
- Gated update admin tooling behind `?admin` to avoid loading on public visits.
- Added `rel="noopener noreferrer"` to external links.
- Normalized home links to `/` to reduce duplicate URL surfaces.
- Regenerated `sitemap.xml` with `lastmod` entries.

### Files updated
- assets/js/photography.js
- assets/js/update-detail.js
- assets/js/updates.js
- index.html
- 404.html
- updates/index.html
- updates/view.html
- projects/index.html
- projects/view.html
- publications/index.html
- photography/index.html
- assets/partials/footer.html
- assets/partials/header.html
- photography/index.html
- 404.html
- sitemap.xml

### New/Generated
- assets/js/update-admin-config.js
- assets/photography/** resized variants
- assets/img/updates/gallery/** resized variants

## 2026-02-04 (Carousel Update)
- Made testimonials carousel normalization more resilient with a transition fallback to preserve seamless looping.

### Files updated
- assets/js/home-testimonials.js

## 2026-02-04 (Carousel Loop Fix)
- Adjusted testimonials loop normalization to preserve visual position by shifting translate instead of recomputing from offset.

### Files updated
- assets/js/home-testimonials.js

## 2026-02-04 (Carousel Loop Fix 2)
- Adjusted testimonials loop normalization to preserve visual position using actual card centers (avoids jump on wrap).

### Files updated
- assets/js/home-testimonials.js

## 2026-02-04 (Carousel Loop Fix 3)
- Normalized testimonials loop using target transform deltas to avoid jump on wrap.

### Files updated
- assets/js/home-testimonials.js

## 2026-02-04 (Carousel Loop Fix 4)
- Switched testimonials carousel to step-based transitions to prevent long wrap jumps.

### Files updated
- assets/js/home-testimonials.js

## 2026-02-04 (Testimonials Infinite Scroll)
- Rebuilt testimonials carousel to use scroll-based infinite loop with tripled content and seamless wrap.
- Enabled native scroll snapping and hid scrollbars in the testimonials viewport.

### Files updated
- assets/js/home-testimonials.js
- assets/css/style.css

## 2026-02-04 (Testimonials Slick Carousel)
- Replaced custom testimonials carousel logic with Slick (center mode) for seamless infinite looping.
- Wired existing prev/next buttons to Slick arrows and preserved card styling.

### Files updated
- index.html
- assets/js/home-testimonials.js
- assets/css/style.css

## 2026-02-04 (Slick CSP Allowlist)
- Allowed Slick/jQuery CDNs in the homepage CSP so the carousel scripts/styles can load.

### Files updated
- index.html

## 2026-02-04 (Testimonials Styling)
- Increased visual separation between testimonials with Slick slide padding.
- Ensured center testimonial is fully opaque while side cards remain dimmed.

### Files updated
- assets/css/style.css

## 2026-02-04 (Testimonials Styling Fix)
- Set base testimonial opacity to 1 and dimmed only non-center slides.

### Files updated
- assets/css/style.css

## 2026-02-04 (Testimonials Styling Fix 2)
- Dimmed all testimonial cards by default and restored full opacity for Slick current/center slides with higher specificity.

### Files updated
- assets/css/style.css

## 2026-02-04 (Testimonials Center Padding)
- Added Slick `centerPadding` to align carousel gutter with site padding.

### Files updated
- assets/js/home-testimonials.js

## 2026-02-04 (Testimonials Styling Fix 3)
- Enforced Slick slide padding and center opacity via `.slick-slide.slick-center` selectors.

### Files updated
- assets/css/style.css

## 2026-02-04 (Testimonials Center Class)
- Added explicit center-slide class toggling via Slick events to ensure opacity/scale styling applies.

### Files updated
- assets/js/home-testimonials.js
- assets/css/style.css

## 2026-02-04 (Testimonials Slick Reset)
- Rebuilt testimonials carousel JS to render cards and initialize Slick center mode only.
- Simplified testimonials CSS to rely on Slick structure for spacing and center emphasis.

### Files updated
- assets/js/home-testimonials.js
- assets/css/style.css

## 2026-02-04 (Testimonials Removed)
- Removed testimonials carousel section and all Slick assets.
- Removed testimonials styling and cleared testimonials JS.

### Files updated
- index.html
- assets/css/style.css
- assets/js/home-testimonials.js
