# Website Performance And Modularity TODO

This file is the implementation backlog for improving the performance, maintainability, and modularity of this website.

It is written so that a future Codex agent can be pointed at this file and asked to implement items one by one without needing to rediscover the architecture from scratch.

The repository is a static HTML + CSS + vanilla JS site. Content remains JSON-authored, but the main listings and detail pages are increasingly pre-rendered into shipped HTML. Shared layout chrome is synchronized from partials. The site is expected to work on normal hosting and local `file:` previews.

Do not treat this file as permission to redesign the visual system or break the repo contracts in `AGENTS.md`.

## Working Rules For Future Agents

- Read `AGENTS.md` before implementing any item.
- Preserve DOM hooks, JSON shapes, and `file:` support unless the specific task explicitly changes them.
- Reuse existing UI patterns from `assets/css/style.css` and `design-system/index.html`.
- If a reusable production pattern is added, mirror it in `design-system/index.html`.
- If header/footer/back-to-top markup changes, update both the partial HTML and the fallback strings in `assets/js/includes.js`.
- If a new top-level route or detail route is introduced, update `scripts/generate_sitemap.py` and regenerate `sitemap.xml`.
- Prefer small, isolated PR-sized changes. Do not bundle unrelated items together.

## How To Use This Backlog

Each task below includes:

- `Priority`: `P0`, `P1`, `P2`, or `P3`
- `Problem`: what is currently inefficient or brittle
- `Why It Matters`: the concrete performance or maintenance cost
- `Affected Files`: where the work likely lives
- `Plan`: implementation direction
- `Acceptance Criteria`: how to know the task is complete
- `Notes / Risks`: constraints or cautions

Suggested implementation order is listed first. Individual tasks are intentionally atomic enough that they can be executed one by one.

## Suggested Execution Order

1. `P0-A1` Add measurement and baseline reporting.
2. `P0-A2` Remove synchronous runtime partial injection in production builds.
3. `P0-A3` Eliminate `@import` from CSS delivery and introduce build-time CSS output.
4. `P0-A4` Replace the testimonials jQuery + Slick dependency stack.
5. `P0-A5` Convert and subset fonts to WOFF2.
6. `P0-A6` Standardize responsive image generation and modern formats.
7. `P1-B1` Pre-render JSON-driven page content at build time where possible.
8. `P1-B2` Introduce shared JS utilities for repeated rendering logic.
9. `P1-B3` Reduce below-the-fold JS work with lazy initialization.
10. `P1-B4` Tune animation, blur, and expensive paint effects.
11. `P2-C1` Modularize hardcoded home-page editorial sections where useful.
12. `P2-C2` Consolidate repeated metadata and route configuration.
13. `P2-C3` Improve hosting and caching policy assumptions.
14. `P3-D1` Optional advanced optimizations and guardrails.

## Audit Summary

### High-level findings

- The site is small enough to optimize aggressively without introducing a framework.
- The current biggest performance losses come from runtime work that could be done before deploy.
- Shared layout is fetched and injected synchronously on every page load.
- CSS delivery includes an `@import`, which adds an avoidable render-blocking chain.
- The home page loads jQuery and Slick just for a single testimonials carousel.
- Fonts are served as raw TTF files instead of compressed web-optimized formats.
- Several large images are heavier than they need to be.
- JSON content is often fetched and rendered client-side even when it could be pre-rendered into static HTML.
- The JS layer contains repeated helper logic that should be centralized.
- Some sections are still hardcoded and not easily reusable or editable.

### Important measured repository facts

- `assets/css/style.css` is about 68 KB.
- `assets/css/base.css` is about 6 KB.
- `assets/js` is about 128 KB total.
- `assets/fonts` is about 2.0 MB total.
- `assets/img` is about 13 MB total.
- `assets/photography` is about 3.9 MB total.
- `assets/docs` is about 16 MB total.
- The largest checked-in image found during audit was `assets/img/updates/gallery/emi-2025.jpg` at about 2.85 MB.
- `NotoSansSymbols2-Regular.ttf` is about 1.23 MB by itself.
- `Montserrat-VariableFont_wght.ttf` is about 689 KB.

## P0 Tasks

### P0-A1: Establish a real performance baseline

- Priority: `P0`
- Problem:
  The repo does not currently encode a repeatable way to measure performance improvements. Changes can be made, but gains or regressions will be subjective.
- Why It Matters:
  Without a baseline, later agents may optimize the wrong thing or accidentally regress the site.
- Affected Files:
  - `.github/workflows/`
  - `README` or new docs file if needed
  - Optional: `scripts/`
- Plan:
  - Add a lightweight reproducible measurement workflow.
  - At minimum, document baseline metrics for home and one representative section page.
  - Prefer adding Lighthouse CI or a simple scripted check.
  - Capture:
    - total blocking time
    - LCP
    - CLS
    - page weight
    - request count
    - font bytes
    - image bytes
  - Include instructions for local and CI runs.
- Acceptance Criteria:
  - There is a documented baseline process.
  - At least home, projects, updates, and photography can be measured consistently.
  - Future agents can compare before/after results.
- Notes / Risks:
  - Keep tooling minimal.
  - Do not require a Node toolchain unless absolutely necessary. A Python or simple CI integration may be cleaner for this repo.

#### Progress Log

- 2026-03-24: Added a zero-dependency static baseline generator at `scripts/perf_baseline.py`, a Lighthouse summary helper at `scripts/summarize_lighthouse.py`, a CI workflow at `.github/workflows/performance-baseline.yml`, and baseline docs/results under `docs/performance/`. The committed static baseline now covers home, projects, updates, and photography. Browser metrics (`LCP`, `TBT`, `CLS`) are wired through the GitHub Actions workflow and should be captured from the uploaded artifact on the first run.

### P0-A2: Remove synchronous runtime partial injection from production

- Priority: `P0`
- Problem:
  `assets/js/includes.js` currently injects shared partials with synchronous XHR:
  - header
  - footer
  - back-to-top
  This blocks the main thread and adds extra work on every page.
- Why It Matters:
  This is one of the clearest performance deficiencies in the repo. It delays interactivity and layout stabilization for content that could be static at deploy time.
- Affected Files:
  - `assets/js/includes.js`
  - `assets/partials/header.html`
  - `assets/partials/footer.html`
  - `assets/partials/back-to-top.html`
  - `index.html`
  - `projects/index.html`
  - `projects/view.html`
  - `publications/index.html`
  - `updates/index.html`
  - `updates/view.html`
  - `teaching/index.html`
  - `teaching/view.html`
  - `photography/index.html`
  - `404.html`
  - likely `scripts/` for a build helper
- Plan:
  - Introduce a build-time partial inliner.
  - Generate final static HTML files with header/footer/back-to-top already present.
  - Keep the current fallback strategy only for local `file:` preview or design-system/local workflows if still needed.
  - Ideally split includes behavior into:
    - production: no runtime partial fetches
    - local/file preview fallback: minimal runtime support
  - Consider replacing `includes.js` with:
    - a tiny nav-state initializer only
    - optional file-protocol support helper
- Acceptance Criteria:
  - Production pages no longer depend on synchronous XHR to render shared chrome.
  - Header/footer/back-to-top are visible in static HTML output before JS runs.
  - Active-link behavior still works.
  - `file:` preview still works or a documented dev build flow replaces it safely.
- Notes / Risks:
  - Must preserve AGENTS partial contracts.
  - If markup changes, update both partials and any remaining fallback strings.

#### Progress Log

- 2026-03-24: Replaced shipped-page `data-include` placeholders with synced inline partial blocks managed by `scripts/inline_partials.py`. `assets/js/includes.js` no longer performs synchronous partial injection and now only handles file-protocol setup, active-link state, and JSON loading helpers. Added `.github/workflows/sync-shared-partials.yml` so partial changes can be checked on PRs and synced automatically on `main`. Regenerated the static baseline after inlining.

### P0-A3: Remove CSS `@import` and add build-time CSS output

- Priority: `P0`
- Problem:
  `assets/css/style.css` starts with `@import url('./base.css');`.
- Why It Matters:
  CSS `@import` introduces another render-blocking dependency hop. It is a simple, high-value fix.
- Affected Files:
  - `assets/css/style.css`
  - `assets/css/base.css`
  - every HTML file linking stylesheets
  - optional build script in `scripts/`
- Plan:
  - Replace `@import` with either:
    - two explicit `<link rel="stylesheet">` tags in HTML, or
    - one build-generated merged CSS file
  - Prefer a build-generated output because it also enables minification and route-level splitting later.
  - Keep source-of-truth CSS files intact if desired, but generate an optimized production artifact.
- Acceptance Criteria:
  - No production stylesheet uses `@import`.
  - Final CSS delivery is one request or an intentionally minimal set of direct stylesheet requests.
  - Visual output remains unchanged.
- Notes / Risks:
  - Do not lose the distinction between design-system-only CSS and production CSS.

#### Progress Log

- 2026-03-24: Removed the `@import` chain from `assets/css/style.css` and switched HTML entry points to explicit `base.css` + `style.css` loading. Regenerated the static baseline after the CSS delivery change.

### P0-A4: Replace jQuery + Slick for the testimonials carousel

- Priority: `P0`
- Problem:
  The home page loads:
  - Slick CSS from CDN
  - jQuery from CDN
  - Slick JS from CDN
  solely for the testimonials carousel.
- Why It Matters:
  This adds network latency, third-party dependency risk, extra CSS/JS weight, and runtime initialization cost for a single feature.
- Affected Files:
  - `index.html`
  - `assets/js/home-testimonials.js`
  - `assets/css/style.css`
  - `assets/data/testimonials.json`
  - `design-system/index.html` if a reusable testimonial pattern changes
- Plan:
  - Replace Slick with either:
    - a vanilla JS carousel, or
    - CSS scroll-snap plus small JS controls
  - Preserve existing controls and accessibility.
  - Remove jQuery and Slick assets from the home page.
  - Keep the section data-driven.
  - Ensure the section behaves well with reduced motion and on mobile.
- Acceptance Criteria:
  - No page depends on jQuery or Slick.
  - Testimonials still render from JSON.
  - Previous/next buttons work.
  - Keyboard/focus behavior remains acceptable.
  - Visual quality remains consistent with the current design language.
- Notes / Risks:
  - Avoid over-engineering. This site does not need a general-purpose carousel library.

#### Progress Log

- 2026-03-24: Replaced the Slick/jQuery testimonials carousel with a native implementation in `assets/js/home-testimonials.js` and removed the third-party CDN assets from `index.html`. The current version is intentionally lightweight and dependency-free; in future it should be replaced or refined with a more bespoke in-house carousel informed by strong UI component library patterns, without reintroducing third-party runtime carousel dependencies.
- Follow-up: run a browser-level interaction check with testimonials enabled and capture a local Lighthouse pass to confirm control behavior, focus handling, and any layout/performance effects under real rendering conditions.

### P0-A5: Convert fonts to WOFF2 and subset them

- Priority: `P0`
- Problem:
  Fonts are currently served as `.ttf` files:
  - Manrope variable TTF
  - Montserrat variable TTF
  - Noto Sans Symbols 2 TTF
- Why It Matters:
  TTF is significantly heavier than WOFF2 for web delivery. The symbol font is especially costly relative to the amount of iconography actually used.
- Affected Files:
  - `assets/fonts/`
  - `assets/css/base.css`
  - `assets/css/style.css`
  - any build/documentation scripts for font generation
- Plan:
  - Generate WOFF2 versions of the current fonts.
  - Subset glyph sets to only what the site actually uses.
  - Evaluate whether `Noto Sans Symbols 2` can be removed completely:
    - replace arrow glyphs and symbols with inline SVG
    - use CSS pseudo-elements with SVG or simple text
  - Keep `font-display: swap`.
  - Consider preloading only the most important font files if metrics support it.
- Acceptance Criteria:
  - Production font delivery uses WOFF2.
  - Total font payload is materially smaller.
  - No visible regressions in typography or symbols.
  - Symbol font is either removed or substantially reduced.
- Notes / Risks:
  - Preserve the current type system.
  - Test on browsers that matter to the owner.

#### Progress Log

- 2026-03-24: Implemented `/scripts/build_fonts.py` and generated subsetted WOFF2 builds for `Manrope` and `Montserrat`. Updated `/assets/css/base.css` to ship WOFF2 in production, removed the dedicated `Noto Sans Symbols 2` webfont from runtime CSS, and replaced the remaining symbol usage with text/CSS arrows. Resulting font payload dropped from about `2.0 MB` of shipped TTFs to about `56 KB` of shipped WOFF2 for the active typefaces. Follow-up: run browser-level visual checks on the main pages and capture a Lighthouse comparison to validate no typography regressions.

### P0-A6: Standardize image optimization and responsive image generation

- Priority: `P0`
- Problem:
  Image delivery is inconsistent:
  - some images have `srcset`
  - many JS-rendered images do not include width/height
  - some source images are large
  - not all sections consistently use modern formats or generated variants
- Why It Matters:
  Images are the largest asset category in the repo. This is the most direct path to faster loads.
- Affected Files:
  - `assets/img/`
  - `assets/photography/`
  - `index.html`
  - `assets/js/home-updates.js`
  - `assets/js/updates.js`
  - `assets/js/update-detail.js`
  - `assets/js/projects.js`
  - `assets/js/project-detail.js`
  - `assets/js/teaching.js`
  - `assets/js/teaching-detail.js`
  - `assets/js/photography.js`
  - optional scripts under `scripts/`
- Plan:
  - Create a repeatable image pipeline that outputs:
    - `-800`
    - `-1200`
    - `-1600`
    variants where required by the repo contract
  - Add AVIF or WebP generation with JPEG fallback where possible.
  - Add width and height metadata for above-the-fold and JS-rendered images when dimensions are known.
  - Standardize helper logic for image rendering in JS.
  - Audit the heaviest images and recompress or resize originals where appropriate.
  - Verify updates, photography, projects, and teaching all follow the same responsive strategy.
- Acceptance Criteria:
  - All major page images have an intentional responsive strategy.
  - Large images are compressed and sized appropriately.
  - JS-rendered cards/detail views use consistent image helpers.
  - Layout shifts caused by image loading are reduced.
- Notes / Risks:
  - Preserve the JSON asset-path conventions described in `AGENTS.md`.
  - Photography pages are visually sensitive; do not overcompress hero images.

#### Progress Log

- 2026-03-24: Implemented `/scripts/generate_responsive_images.py` and generated managed responsive derivatives plus WebP companions for projects, update galleries, photography assets, update thumbnails, and shared profile imagery. Added `/assets/js/site-images.js` as the shared image manifest/helper and updated the JS-driven cards/detail views to use consistent responsive image rendering with dimensions and `sizes`. Also resized oversized `rdifp.png` and `uofm.png` originals used as small update thumbnails, and removed the unused default teaching philosophy image fetch from `/teaching/index.html`. Follow-up: run a browser-level interaction check across home, projects, updates, teaching, and photography, then capture a local Lighthouse pass to confirm CLS and image-transfer improvements.

## P1 Tasks

### P1-B1: Pre-render JSON-driven sections and detail pages at build time

- Priority: `P1`
- Problem:
  Much of the site content is fetched and rendered in the browser even though the data is static at deploy time.
- Why It Matters:
  Runtime fetching adds latency, JS dependency, and content pop-in. Build-time rendering would improve first paint, stability, and robustness.
- Affected Files:
  - `assets/js/home-updates.js`
  - `assets/js/home-expertise.js`
  - `assets/js/home-testimonials.js`
  - `assets/js/updates.js`
  - `assets/js/update-detail.js`
  - `assets/js/projects.js`
  - `assets/js/project-detail.js`
  - `assets/js/publications.js`
  - `assets/js/teaching.js`
  - `assets/js/teaching-detail.js`
  - `updates/data/updates.json`
  - `projects/data/*.json`
  - `publications/data/*.json`
  - `teaching/data/teaching.json`
  - `assets/data/*.json`
  - likely a new build script in `scripts/`
- Plan:
  - Treat JSON as authoring source of truth.
  - Generate static HTML for:
    - home latest updates
    - home expertise
    - home testimonials
    - projects listing
    - publications listing
    - updates listing
    - teaching listing
    - detail pages for updates/projects/teaching
  - Keep minimal client JS only where interaction is truly needed.
  - If full pre-rendering is too large a first step, start with home and listing pages.
- Acceptance Criteria:
  - Key content is visible in HTML without waiting for data fetches.
  - Search engines and no-JS environments receive meaningful content.
  - Dynamic detail pages are replaced by generated per-slug pages or equivalent pre-rendered output.
- Notes / Risks:
  - This is high value but non-trivial.
  - If implementing incrementally, document which sections remain runtime-hydrated.

#### Progress Log

- 2026-03-24: Added `/scripts/prerender_content.py` to generate static HTML for the home data-driven sections, projects list, updates list, publications list, teaching list, and slug-based detail pages under `/projects/<slug>/`, `/updates/<slug>/`, and `/teaching/<slug>/`. Updated the runtime scripts so shipped HTML is the primary path and JSON fetch/render remains fallback-only for `file:` previews or recovery scenarios. Follow-up: run browser-level route checks on the generated slug pages and capture a Lighthouse comparison against the new pre-rendered output.

### P1-B2: Extract repeated JS helpers into shared utilities

- Priority: `P1`
- Problem:
  The JS codebase duplicates several categories of logic:
  - excerpt generation
  - whitespace sanitization
  - metadata helpers
  - canonical/OG/Twitter updates
  - tab underline logic
  - route source arrays
  - image `srcset` builders
  - HTML escaping
- Why It Matters:
  Duplication increases code size, inconsistency, and maintenance overhead. It also makes future performance work more expensive.
- Affected Files:
  - `assets/js/home-updates.js`
  - `assets/js/updates.js`
  - `assets/js/update-detail.js`
  - `assets/js/project-detail.js`
  - `assets/js/teaching-detail.js`
  - `assets/js/projects.js`
  - `assets/js/publications.js`
  - `assets/js/teaching.js`
  - `assets/js/photography.js`
  - new shared helper files in `assets/js/`
- Plan:
  - Create small shared helper modules or utility files for:
    - text/excerpt helpers
    - metadata helpers
    - image helpers
    - tab/filter helpers
    - shared data source config
  - If staying non-module for compatibility, expose a small namespaced utility object.
  - Avoid introducing a bundler unless justified by the broader build plan.
- Acceptance Criteria:
  - Repeated helper logic is centralized.
  - Page scripts become smaller and more focused.
  - There is a single source of truth for repeated route/data config.
- Notes / Risks:
  - Keep compatibility with `file:` support in mind.
  - Do not break existing DOM hook contracts.

#### Progress Log

- 2026-03-24: Added `/assets/js/site-utils.js` as a shared helper surface for text/excerpt formatting, metadata/head updates, image fallback rendering, taxonomy labels, and reusable filter-tab behavior. Refactored the home, listing, and fallback detail scripts to consume the shared helpers instead of carrying duplicate copies. Follow-up: continue migrating lower-priority scripts such as `update-generator.js` and any future route-specific helpers only if the consolidation clearly reduces maintenance cost.

### P1-B3: Lazy-initialize non-critical sections and below-the-fold JS

- Priority: `P1`
- Problem:
  Several sections initialize immediately even when far below the fold or optional:
  - testimonials
  - updates preview
  - expertise
  - some photography effects
- Why It Matters:
  Non-critical work competes with above-the-fold rendering and interaction.
- Affected Files:
  - `index.html`
  - `assets/js/home-updates.js`
  - `assets/js/home-expertise.js`
  - `assets/js/home-testimonials.js`
  - `assets/js/photography.js`
  - `assets/js/main.js`
- Plan:
  - Use `IntersectionObserver` to defer initialization of sections until they approach the viewport.
  - Keep above-the-fold hero and nav behavior immediate.
  - Delay optional enhancements until after first paint or idle time.
  - Consider `requestIdleCallback` where useful and safe.
- Acceptance Criteria:
  - Non-critical sections do not initialize immediately on first load unless visible.
  - Above-the-fold experience remains intact.
  - Page responsiveness improves on lower-end devices.
- Notes / Risks:
  - Do not create visible content pop-in worse than the current behavior.

#### Progress Log

- 2026-03-24: Added shared lazy helpers to `/assets/js/site-utils.js` and applied them to the home testimonials, home updates fallback, home expertise fallback, and photography page. Below-the-fold home enhancements now wait until their section approaches the viewport, while photography defers non-essential enhancement setup to visibility/idle time and pauses carousel autoplay when the hero is off-screen. Also corrected photography carousel data to use the checked-in width-suffixed images so browser verification runs cleanly.

### P1-B4: Reduce expensive paint and animation costs

- Priority: `P1`
- Problem:
  `assets/css/style.css` contains many expensive effects:
  - `backdrop-filter`
  - multiple blurs and drop-shadows
  - long-running animated tracks
  - parallax motion
  - `will-change` usage
  - complex transitions
- Why It Matters:
  These can hurt smoothness, battery life, and mobile rendering performance.
- Affected Files:
  - `assets/css/style.css`
  - `assets/js/photography.js`
  - `assets/js/main.js`
  - `index.html`
  - `photography/index.html`
- Plan:
  - Audit each animated or filtered effect.
  - Reduce or remove effects that do not materially improve perceived quality.
  - Add more selective motion degradation for:
    - low-width viewports
    - reduced-motion users
    - low-power scenarios if detected heuristically
  - Revisit:
    - sticky header blur
    - home banner marquee
    - hero word cycling
    - photography ambient orb blur/float
    - pointer-based parallax
- Acceptance Criteria:
  - Expensive effects are reduced where their cost is high and value is low.
  - Motion still feels intentional.
  - No obvious visual regressions in core identity areas.
- Notes / Risks:
  - The site’s visual character should remain intact.
  - Photography page can keep higher production value, but only where measured cost is acceptable.

#### Progress Log

- 2026-03-24: Reduced compositor-heavy effects in `assets/css/style.css` by trimming sticky-header blur/shadow, slowing or disabling marquee and hero word animations on lower-cost scenarios, removing reveal blur, and softening photography slide/caption/orb effects. Updated `assets/js/photography.js` so pointer-driven parallax only binds on wide fine-pointer devices and runs with a lower motion budget, and updated `assets/js/main.js` so header/back-to-top scroll state is synchronized through a single `requestAnimationFrame` pass.

## P2 Tasks

### P2-C1: Modularize hardcoded homepage editorial sections where it is useful

- Priority: `P2`
- Problem:
  Several home page sections are hardcoded in `index.html`:
  - hero copy
  - hero banner text
  - about section
  - contact section
  - pronunciation block
  These are not reusable or easy to edit programmatically.
- Why It Matters:
  This is less about raw speed and more about maintainability, repeatability, and future content scalability.
- Affected Files:
  - `index.html`
  - optional new JSON/content files under `assets/data/`
  - optional shared render helpers under `assets/js/`
  - `design-system/index.html` if reusable patterns are formalized
- Plan:
  - Do not blindly JSON-ify everything.
  - Separate content that benefits from authoring reuse from content that is just static editorial copy.
  - Reasonable modularization targets:
    - hero banner messages
    - contact details
    - maybe about paragraphs if the owner wants easier updates
  - Keep semantic HTML and accessibility intact.
  - Only data-drive these sections if doing so improves maintainability without harming performance.
- Acceptance Criteria:
  - The chosen hardcoded sections have a clear, justified content source.
  - The result does not increase page-load cost.
  - Existing visual design and DOM hooks remain intact.
- Notes / Risks:
  - Not every hardcoded section should become JSON-driven.
  - Build-time rendering is preferred over runtime hydration for static editorial content.

#### Progress Log

- 2026-03-24: Moved the homepage hero, banner messages, about copy, pronunciation metadata, and contact content/config into `assets/data/home.json`. Extended `scripts/prerender_content.py` to render those sections back into `index.html` at build time so maintainability improves without adding any client-side fetch or hydration cost. Left the contact form structure and JS hooks in shipped HTML semantics instead of over-abstracting them into runtime data.

### P2-C2: Consolidate repeated metadata, route config, and page shell patterns

- Priority: `P2`
- Problem:
  Multiple HTML files repeat the same:
  - canonical/OG/Twitter patterns
  - preload tags
  - JSON-LD shell
  - hero/page-shell markup
  The detail scripts also repeat metadata mutation logic.
- Why It Matters:
  Repetition creates drift, makes optimization harder, and increases the chance of inconsistent fixes later.
- Affected Files:
  - all page HTML files
  - `assets/js/update-detail.js`
  - `assets/js/project-detail.js`
  - `assets/js/teaching-detail.js`
  - `scripts/generate_sitemap.py`
  - optional build templates/partials
- Plan:
  - Introduce shared page templates or build-time snippets for repeated head markup.
  - Centralize route definitions and section metadata defaults.
  - Consider a tiny static site generation layer without moving to a framework.
- Acceptance Criteria:
  - Shared metadata structure is no longer copied manually across every route.
  - Detail page metadata helpers have one shared source of truth.
  - Future page additions require less duplicated markup.
- Notes / Risks:
  - Preserve the current SEO pattern expectations from `AGENTS.md`.

#### Progress Log

- 2026-03-24: Centralized shipped-page head generation in `scripts/prerender_content.py` so home, section indexes, fallback detail shells, and generated slug detail pages all render canonical/OG/Twitter/JSON-LD from shared helpers/config instead of hand-maintained HTML blocks. Also centralized fallback detail metadata mutation in `assets/js/site-utils.js` and refactored `assets/js/update-detail.js`, `assets/js/project-detail.js`, and `assets/js/teaching-detail.js` to use the shared helper and breadcrumb/site-reference builders.

### P2-C3: Improve static hosting assumptions for caching and compression

- Priority: `P2`
- Problem:
  The code currently assumes little about hosting-level optimization. Some fetches explicitly defeat caching.
- Why It Matters:
  Static sites benefit disproportionately from proper CDN/browser caching and compression.
- Affected Files:
  - hosting config if present
  - `.github/workflows/` if deploy config is encoded there
  - `assets/js/home-testimonials.js`
  - `assets/js/photography.js`
  - any future build scripts that produce hashed filenames
- Plan:
  - Remove unnecessary `no-store` and `no-cache` fetch behavior for static JSON.
  - Introduce asset versioning or content-hashed filenames where practical.
  - Ensure deploy platform serves Brotli/gzip and long-lived cache headers for versioned assets.
  - Document the recommended hosting config.
- Acceptance Criteria:
  - Static assets are cacheable with a safe invalidation strategy.
  - JSON fetches no longer bypass cache without reason.
  - Hosting setup recommendations exist if they cannot be encoded in repo.
- Notes / Risks:
  - Needs coordination with actual hosting platform.

#### Progress Log

- 2026-03-24: Removed the remaining cache-defeating JSON fetch option from `assets/js/photography.js`, added `.nojekyll` for safer GitHub Pages style publishing, and checked in deployment guidance under `docs/hosting/README.md` plus `docs/hosting/_headers.example`. The current documented policy uses bounded caching for mutable assets and JSON, with a clear path to move to long-lived immutable caching once versioned asset URLs are introduced.

## P3 Tasks

### P3-D1: Add stronger performance guardrails and developer automation

- Priority: `P3`
- Problem:
  Even after fixes, future edits could regress performance quietly.
- Why It Matters:
  Guardrails prevent the need for repeated full audits.
- Affected Files:
  - `.github/workflows/`
  - `scripts/`
  - documentation
- Plan:
  - Add CI checks for:
    - image dimensions / oversized asset warnings
    - missing responsive variants
    - missing width/height for designated images
    - page-weight budget warnings
    - Lighthouse thresholds if feasible
  - Add helper scripts for:
    - generating image variants
    - building inlined partials
    - generating static pages from JSON
- Acceptance Criteria:
  - Common regressions are automatically detectable.
  - Future agents have scripts instead of manual one-off processes.
- Notes / Risks:
  - Keep the tooling footprint proportionate to the project.

## Specific Deficiencies Found During Audit

This section is intentionally more exhaustive and less implementation-ready. It records the deficiencies that motivated the tasks above.

### Rendering / Architecture deficiencies

- Shared partials are fetched and injected at runtime instead of existing in the shipped HTML.
- `includes.js` uses synchronous XHR for those partials.
- Many pages depend on JS to render core content that could be present statically.
- Dynamic detail pages fetch JSON in the browser and then mutate metadata after load.
- Shared route/source configuration is duplicated across scripts.
- Some home-page editorial sections are hardcoded and not easily reusable.
- Photography includes default content hardcoded inside JS rather than keeping all content in data.

### CSS deficiencies

- CSS delivery uses `@import`.
- The main stylesheet contains all route styles, including page-specific code for routes a user may never visit.
- There are many expensive visual effects in one global stylesheet.
- Some effects likely cost more than their visual value on mobile or low-power devices.

### JavaScript deficiencies

- Repeated helper logic across page scripts increases code duplication.
- Some initialization runs eagerly even for below-the-fold content.
- Multiple scripts rebuild similar tab/filter interactions independently.
- There is still DOM mutation via large `innerHTML` strings in many places.
- There is no shared utility layer for metadata/image/text helpers.

### Asset deficiencies

- Fonts are not web-optimized.
- Symbol font payload is unusually heavy relative to its likely use.
- Image optimization is inconsistent.
- Not all JS-rendered images define dimensions or use a standardized responsive helper.
- Some source images are heavy enough to materially slow real-world loads.

### Third-party dependency deficiencies

- Home testimonials rely on CDN-hosted jQuery and Slick.
- Third-party resources add extra DNS/TLS/request overhead.
- The home page pays that dependency cost regardless of whether the carousel is a major value driver.

### Caching deficiencies

- Some JSON fetches explicitly bypass or weaken cache behavior.
- There is no documented content-hash or versioning strategy for static assets.
- There is no documented hosting compression/cache policy in the repo.

### Tooling deficiencies

- No explicit performance budget or measurement workflow was found.
- No obvious asset pipeline exists for responsive image generation or font optimization.
- No build step currently appears to own production HTML assembly.

## Implementation Notes By Area

### Area: Home page

Potential items:

- replace testimonials dependency stack
- pre-render latest updates
- pre-render expertise
- decide whether testimonials should be pre-rendered or lazy-initialized
- modularize contact/hero/about content only if it improves maintainability without runtime cost
- audit hero animations and banner marquee cost

Success condition:

- Home loads fast with minimal third-party code and stable above-the-fold rendering.

### Area: Updates

Potential items:

- pre-render listing from `updates/data/updates.json`
- generate static detail pages per slug
- unify excerpt generation helper
- centralize gallery image rendering helper
- ensure responsive images and width/height treatment for thumbnails and gallery content

Success condition:

- Updates listing and details are visible without client-side fetch delay.

### Area: Projects

Potential items:

- centralize `sources` config
- pre-render listing and detail pages
- unify card rendering and image helpers
- ensure project media uses responsive variants

Success condition:

- Project pages do not fetch multiple JSON files at runtime just to locate one project.

### Area: Publications

Potential items:

- pre-render grouped publication list
- centralize filter-tab helper
- reduce JS accordion overhead if not needed at initial load
- consider whether all abstract bodies need immediate DOM presence

Success condition:

- Publications page is mostly static HTML with only light progressive enhancement for filtering/accordion behavior.

### Area: Teaching

Potential items:

- pre-render hero/philosophy/experience cards
- centralize filter-tab helper
- generate static course detail pages
- standardize course card image helpers

Success condition:

- Teaching content loads as static HTML, with JS only for lightweight filtering if needed.

### Area: Photography

Potential items:

- keep only necessary interactivity
- simplify or gate parallax/ambient effects
- allow cached JSON fetches or pre-render the carousel
- standardize responsive image helpers and modern formats
- move fallback data out of JS if appropriate

Success condition:

- Photography preserves visual quality but no longer overspends JS and paint cost.

## Agent-Friendly Checklist

Future agent: when implementing one item, append a short progress note under the item you completed with:

- date
- what changed
- what metrics improved
- any follow-up tasks spawned

Suggested format:

```md
### Progress Log

- 2026-03-24: Implemented production partial inlining via `scripts/build_site.py`. Removed synchronous include fetches from shipped pages. Kept `file:` fallback path for local preview. Home request count dropped from X to Y.
```

## Completion Criteria For The Overall Backlog

The backlog should be considered substantially complete when all of the following are true:

- Shared layout is not injected synchronously at runtime in production.
- jQuery and Slick are removed.
- Fonts are served in optimized web formats.
- Image delivery is standardized and responsive across the site.
- Core listing/detail content is pre-rendered or otherwise available without waiting on runtime fetches.
- Repeated JS helper logic is centralized.
- Below-the-fold work is deferred appropriately.
- Expensive motion and blur effects are tuned based on measurement.
- Performance measurement exists and regressions can be detected.
