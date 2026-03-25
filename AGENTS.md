# AGENTS.md

This repository is a static personal website. Future coding agents should treat this file as the working contract for keeping UI, data structures, assets, and page behavior consistent.

## Purpose

- Preserve the current visual system and information architecture.
- Reuse existing UI patterns before inventing new ones.
- Keep content data-driven where the repo is already data-driven.
- Avoid breaking DOM hooks, JSON schemas, SEO metadata, and static hosting assumptions.

## High-Level Architecture

- This is a plain HTML + CSS + vanilla JS site. There is no app framework, bundler, or package manager in the repo.
- Pages are mostly top-level HTML files plus section folders:
  - `/index.html`
  - `/projects/`
  - `/publications/`
  - `/updates/`
  - `/teaching/`
  - `/photography/`
  - `/design-system/`
- Shared assets live under `/assets/`.
- Shared layout chrome is authored in `/assets/partials/` and synchronized into page HTML by `/scripts/inline_partials.py`.
- `/assets/js/includes.js` now provides lightweight runtime helpers only:
  - file-protocol flagging
  - active-link state
  - JSON loading helpers for `file:` previews
- `/assets/js/site-utils.js` is the shared client-side helper surface for:
  - text/excerpt formatting
  - head/meta updates
  - reusable filter-tab behavior
  - visibility/idle-based lazy initialization helpers
- Most content-heavy sections are authored in JSON and pre-rendered into shipped HTML by `/scripts/prerender_content.py`.
- Runtime page scripts should treat the shipped HTML as the primary path and only fetch/re-render as a fallback when pre-rendered markup is absent.
- The site is expected to work both on normal hosting and in local `file:` previews. Do not casually break that.

## Source Of Truth For UI

- The UI source of truth is the combination of:
  - `/design-system/index.html`
  - `/design-system/design-system.css`
  - `/assets/css/base.css`
  - `/assets/css/style.css`
- `design-system/` is a local reference page, not a production route. It is intentionally locked down outside localhost or `file:`.
- When adding a new reusable UI pattern:
  1. Reuse existing classes from `/assets/css/style.css` if possible.
  2. If a genuinely new reusable pattern is needed, add it to production CSS first.
  3. Then add a matching example to `/design-system/index.html`.
  4. Keep `/design-system/design-system.css` limited to demo/layout helpers for the design system page itself.

## Visual System Contracts

These values already define the site look. Do not change them casually.

- Fonts:
  - Body: `Manrope`
  - Headings: `Montserrat`
- Directional arrows and small glyphs use text/CSS treatment rather than a dedicated symbol font.
- Core tokens live in `/assets/css/base.css`.
- Primary colors:
  - `--color-primary`
  - `--color-primary-strong`
  - `--color-accent`
  - `--color-accent-muted`
- Radii:
  - Buttons: `--radius-md` = `10px`
  - Cards: `--radius-lg` = `16px`
- Layout:
  - `--content-max-width: 1200px`
  - `--section-inline-pad: clamp(16px, 4vw, 48px)`
- Typography:
  - Body copy uses `--type-p`
  - Headings use `--type-h1` through `--type-h6`
  - Card titles use `--type-card-title`

## Existing UI Patterns To Reuse

Before inventing new markup or styles, check whether one of these already fits:

- Buttons: `.btn.primary`, `.btn.secondary`, `.btn.tertiary`, plus `.sm` and `.lg`
- Section heading pattern: `.eyebrow` + heading + `.muted`
- Card types:
  - `.project-card`
  - `.update-card`
  - `.teaching-card`
  - `.testimonial-card`
  - `.expertise-card`
- Pills and badges:
  - `.project-card__pill`
  - `.update-tag`
  - `.pub-meta .tag`
- Filters/tabs:
  - `.pub-filters`
  - `.pub-filters__tabs`
  - `.pub-filters__tab`
  - `.pub-filters__underline`
- Detail page shell:
  - `.hero.hero--update`
  - `.update-detail`
  - `.update-detail__media`
- Shared utilities:
  - `.contained`
  - `.muted`
  - `.section-rule`
  - `.skip-link`

## Runtime And DOM Hook Contracts

- Many scripts depend on exact ids and class names in the HTML templates.
- Do not rename ids/classes that are queried in JS unless you update the corresponding script in the same change.
- Important JS-owned hooks include:
  - Global:
    - `#site-header`
    - `#menuToggle`
    - `#menuCheckbox`
    - `#mobileMenu`
    - `#menuOverlay`
    - `#year`
  - Updates:
    - `.updates-feed .update-list`
    - `#viewTitle`
    - `#viewTag`
    - `#viewDate`
    - `#viewBody`
  - Projects:
    - `#projTypeFilters`
    - `#projectsGrid`
    - `#projTitle`
    - `#projType`
    - `#projYear`
    - `#projMeta`
    - `#projMedia`
    - `#projContent`
  - Publications:
    - `#pubFilters`
    - `#pubApp`
  - Teaching:
    - `#teachingTitle`
    - `#teachingSubtitle`
    - `#philosophyTitle`
    - `#philosophyHeadline`
    - `#philosophyPrinciples`
    - `#philosophyOutcome`
    - `#philosophyMedia`
    - `#philosophyImage`
    - `#philosophyPlaceholder`
    - `#teachingFilters`
    - `#teachingCards`
    - `#teachTitle`
    - `#teachMetaPill`
    - `#teachMetaYear`
    - `#teachMeta`
    - `#teachMedia`
    - `#teachBody`
  - Home:
    - `.updates-preview .update-list`
    - `.expertise__grid`
    - `[data-testimonials-carousel]`
  - Photography:
    - `.photo-hero`
    - `[data-carousel]`
    - `[data-carousel-nav="prev"]`
    - `[data-carousel-nav="next"]`

## Partial Include Contract

- Shared markup lives in:
  - `/assets/partials/header.html`
  - `/assets/partials/footer.html`
  - `/assets/partials/back-to-top.html`
- After changing header/footer/back-to-top markup, run:
  - `python scripts/inline_partials.py`
- HTML pages store synced partial markup inside managed `partial-sync` comment blocks.
- If you add a new top-level section, also review:
  - nav links in header/footer partials
  - `scripts/inline_partials.py`
  - active-link logic in `includes.js`
  - `scripts/generate_sitemap.py`

## Data-Driven Content Contracts

### Home support data

- `/assets/data/home.json`
  - Purpose: build-time source of truth for reusable homepage editorial content that should not require runtime hydration.
  - Render path: `/scripts/prerender_content.py` writes this data into `/index.html`.
  - Current intended scope:
    - hero heading lines
    - hero rotating highlight words
    - hero intro copy
    - hero CTA labels/links
    - hero banner messages
    - about heading and paragraphs
    - pronunciation metadata
    - contact headings, intro, contact details, and form endpoint/button label
  - Keep this file focused on authorable content/config. Do not move purely structural form markup or JS hooks here unless there is a clear maintenance benefit.
- `/assets/data/expertise.json`
  - Shape: `{ "enabled": boolean, "items": [{ "title": string, "summary": string }] }`
  - Current state: feature can be fully hidden with `"enabled": false`
- `/assets/data/testimonials.json`
  - Shape: `{ "enabled": boolean, "items": [{ "name": string, "title": string, "affiliation": string, "quote": string, "photo": string }] }`
  - Current state: feature can be fully hidden with `"enabled": false`
- Home testimonials use the native carousel logic in `/assets/js/home-testimonials.js`.

### Updates

- Data file: `/updates/data/updates.json`
- Listing script: `/assets/js/updates.js`
- Detail script: `/assets/js/update-detail.js`
- Home preview script: `/assets/js/home-updates.js`
- Build-time renderer: `/scripts/prerender_content.py`
- Required fields per update:
  - `slug`
  - `title`
  - `date` in `YYYY-MM-DD`
  - `image.src`
- Optional fields:
  - `tag` in `Award | Publication | Milestone | Other`
  - `image.alt`
  - `detail` HTML string
  - `gallery[]`
  - `url`
- Important:
  - `detail` is inserted as raw HTML. Treat it as trusted author content only.
  - Excerpts are derived from the first paragraph of `detail` when available.
  - Shipped update links should resolve to `/updates/<slug>/`.
  - `updates/view.html` remains a JSON-driven fallback shell and should not be treated as the primary production route.

### Projects

- Data files:
  - `/projects/data/research.json`
  - `/projects/data/courses.json`
  - `/projects/data/internships.json`
  - `/projects/data/others.json`
- Listing script: `/assets/js/projects.js`
- Detail script: `/assets/js/project-detail.js`
- Build-time renderer: `/scripts/prerender_content.py`
- Required fields per project:
  - `slug`
  - `title`
  - `summary`
  - `card.image`
- Common optional fields:
  - `years`
  - `card.alt`
  - `detail.body`
  - `detail.images[]`
- Category membership is currently assigned in JS through the `sources` array. If you add another project category, update that array.
- Shipped project links should resolve to `/projects/<slug>/`.
- `projects/view.html` remains a JSON-driven fallback shell and should not be treated as the primary production route.

### Publications

- Data files:
  - `/publications/data/journals.json`
  - `/publications/data/conferences.json`
  - `/publications/data/talks.json`
- Script: `/assets/js/publications.js`
- Build-time renderer: `/scripts/prerender_content.py`
- Expected top-level shape: `{ "publications": [...] }`
- Required publication fields:
  - `id`
  - `year`
  - `type`
  - `title`
  - `authors[]`
- Common optional fields:
  - `status`
  - `venue`
  - `volume`
  - `issue`
  - `pages`
  - `date`
  - `abstract`
  - `keywords[]`
  - `links`
- Link buttons are intentionally ordered and styled:
  - 1st = primary
  - 2nd = secondary
  - remaining = tertiary
- Keep link priority compatible with the current order in `publications.js`.

### Teaching

- Data file: `/teaching/data/teaching.json`
- Listing script: `/assets/js/teaching.js`
- Detail script: `/assets/js/teaching-detail.js`
- Build-time renderer: `/scripts/prerender_content.py`
- Top-level keys:
  - `hero`
  - `philosophy`
  - `experiences`
- Each experience currently expects:
  - `slug`
  - `courseNumber`
  - `courseTitle`
  - `university`
  - `year`
  - `card.summary`
  - `card.image`
  - `card.alt`
  - `detail.body`
- Shipped teaching links should resolve to `/teaching/<slug>/`.
- `teaching/view.html` remains a JSON-driven fallback shell and should not be treated as the primary production route.

### Photography

- Data file: `/photography/data/photos.json`
- Script: `/assets/js/photography.js`
- Current checked-in JSON only defines `carousel`.
- The script contains default fallback content for `carousel`, `categories`, and `stories`.
- The current page template only mounts the hero carousel UI. Do not assume category/story support is live in production unless you also add the required HTML containers.
- Current checked-in photography carousel entries point at generated width-suffixed raster files (for example `-1200.jpg`) rather than unsuffixed originals.

## Asset Conventions

- Shared images for the main site live under `/assets/img/`.
- Photography images live under `/assets/photography/`.
- Documents live under `/assets/docs/`.
- Icons live under `/assets/icons/`.
- Audio lives under `/assets/audio/`.
- Fonts live under `/assets/fonts/`.
- JSON content currently stores many asset paths as `assets/...` without a leading slash. Preserve that convention inside JSON unless you update all consumers deliberately.
- Production HTML often uses root-relative paths like `/assets/...`. Keep that distinction in mind.

## Responsive Image Convention

- Shared responsive image metadata and rendering helpers now live in `/assets/js/site-images.js`.
- Regenerate managed image assets with `/scripts/generate_responsive_images.py`.
- The current pipeline generates width-suffixed raster variants where appropriate:
  - content imagery: `-800`, `-1200`, `-1600`
  - small square thumbnails: `-128`, `-256`, `-512`
- The pipeline also generates `.webp` companions for managed raster assets.
- This is currently used in:
  - update cards and update galleries
  - projects cards and project detail media
  - teaching cards and teaching detail media
  - home testimonials
  - photography hero and cards
- If you add a raster image intended for responsive rendering, rerun the generator or update the helper manifest deliberately.

## SEO And Metadata Contracts

- Static list pages already ship with canonical, Open Graph, Twitter, and JSON-LD metadata.
- Fallback detail shells update metadata client-side in:
  - `/assets/js/update-detail.js`
  - `/assets/js/project-detail.js`
  - `/assets/js/teaching-detail.js`
- Primary production detail pages are generated HTML under:
  - `/updates/<slug>/index.html`
  - `/projects/<slug>/index.html`
  - `/teaching/<slug>/index.html`
- When creating a new detail page type, preserve this pattern:
  - canonical URL
  - description
  - Open Graph/Twitter tags
  - JSON-LD structured data
- If you add new routes or new dynamic slugs, review sitemap generation.

## Sitemap Maintenance

- Sitemap generator: `/scripts/generate_sitemap.py`
- It currently includes:
  - static top-level routes
  - update detail URLs
  - project detail URLs
  - teaching detail URLs
- If you add:
  - new top-level pages
  - new dynamic detail types
  - new route patterns
  update the sitemap generator and regenerate `/sitemap.xml`.

## Dependency Guidance

- Keep dependencies minimal.
- Do not add new libraries unless the feature cannot be solved cleanly with the current static stack.

## Change Rules For Future Agents

- Prefer extending the current static HTML/CSS/JS approach instead of introducing a framework.
- Reuse existing CSS classes and component patterns before creating new ones.
- Do not rename JS hooks casually.
- Do not change JSON shapes casually.
- Do not move or rename shared assets casually.
- Do not remove `file:`-protocol support unless explicitly asked.
- Keep accessibility intact:
  - preserve alt text
  - preserve button labels
  - preserve keyboard behavior on tabs/carousels/menus
  - preserve skip links
- Keep mobile behavior intact. Every visual change should be checked at narrow and wide widths.

## Practical Checklist Before Finishing A Change

- Does the change reuse existing patterns from `/design-system/` and `/assets/css/style.css`?
- If partial markup changed, did you also update `includes.js` fallbacks?
- If a script binds to a pre-rendered template, are all queried ids/classes still present?
- If JSON changed, does it still match the current schema?
- If a new reusable UI component was added, is it represented in `/design-system/index.html`?
- If new routes or slugs were introduced, did you update sitemap generation?
- If new content uses raw HTML in JSON, is it trusted author content?

## Files Worth Reading First

- `/assets/css/base.css`
- `/assets/css/style.css`
- `/design-system/index.html`
- `/design-system/README.md`
- `/assets/js/includes.js`
- `/assets/js/site-utils.js`
- `/scripts/inline_partials.py`
- `/assets/js/main.js`
- `/projects/README.md`
- `/updates/README.md`
- `/publications/data/JSON_GUIDE.md`
- `/teaching/data/JSON_GUIDE.md`
