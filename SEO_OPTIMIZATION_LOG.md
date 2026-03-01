
## 2026-02-17 (SEO Repair Pass)
- Replaced stale social image references from /assets/img/portrait.jpg to /assets/img/portrait-1200.jpg across listing/detail pages.
- Added teaching detail slug URLs to sitemap for crawl discoverability.
- Added Course JSON-LD + breadcrumb structured data on teaching detail pages.

### Files updated
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/teaching/index.html
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/teaching/view.html
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/projects/index.html
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/projects/view.html
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/publications/index.html
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/updates/index.html
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/updates/view.html
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/assets/js/teaching-detail.js
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/sitemap.xml

## 2026-03-01 (SEO Scan + Fix)
- Added missing updates detail URL (ijss-publication) to sitemap.xml to align sitemap coverage with updates data.

## 2026-03-01 (Sitemap Automation)
- Added automated sitemap generator script to build routes from updates/projects/teaching JSON data.
- Added GitHub Actions workflow to regenerate and commit `sitemap.xml` on `main` when relevant content files change.

### Files added
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/scripts/generate_sitemap.py
- /Users/hardik/Library/CloudStorage/Dropbox-Personal/Personal Website/.github/workflows/update-sitemap.yml
