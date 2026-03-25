# Hosting And Cache Strategy

This repository is a plain static site and is currently compatible with GitHub Pages style publishing.

## Current Assumptions

- `.nojekyll` is checked in so GitHub Pages can serve the repo as a raw static site without Jekyll processing.
- The site should not bypass browser/CDN caching for JSON content under normal operation.
- This repo does not currently fingerprint or content-hash asset filenames.

## Safe Cache Policy Right Now

Because asset filenames are still mostly stable and human-readable, the safest default policy is bounded caching rather than `immutable` caching.

- HTML:
  `Cache-Control: public, max-age=0, must-revalidate`
- JSON content:
  `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
- CSS, JS, fonts, images, icons, audio, PDFs:
  `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`

This gives repeat visitors meaningful cache hits without risking week-long stale assets after a deploy.

## Preferred Future Policy

Once the build pipeline produces versioned asset URLs, either:

- content-hashed filenames, or
- explicit release query strings such as `?v=<release-id>`

then the static asset policy should move to:

- versioned CSS, JS, fonts, images, icons, audio, PDFs:
  `Cache-Control: public, max-age=31536000, immutable`
- HTML:
  `Cache-Control: public, max-age=0, must-revalidate`
- JSON content:
  keep short or medium cache unless JSON URLs are versioned too

## Compression

If the site is served through a host, CDN, or reverse proxy that supports compression controls, enable:

- Brotli for text assets when available
- gzip fallback for text assets

At minimum, ensure compression is enabled for:

- `text/html`
- `text/css`
- `application/javascript`
- `application/json`
- `image/svg+xml`
- `application/xml`

Do not expect meaningful gains from compressing already-compressed binary assets such as JPEG, WebP, AVIF, MP3, or WOFF2.

## GitHub Pages Note

GitHub Pages is a reasonable static origin for this repo, but this repository cannot rely on custom cache-header files being honored there. If explicit cache policy control is needed, front the site with a CDN/reverse proxy or move to a host that supports custom response headers.

## Files To Revisit When Adding Versioned Assets

- `/scripts/prerender_content.py`
- `/assets/js/includes.js`
- `/assets/js/site-utils.js`
- every HTML page that references local CSS or JS

## Header Examples

See `/docs/hosting/_headers.example` for a host-agnostic example policy that can be adapted to platforms supporting custom response headers.
