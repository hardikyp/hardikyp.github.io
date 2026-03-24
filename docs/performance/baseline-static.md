# Static Performance Baseline

Static asset baseline only. Dynamic browser metrics such as LCP, TBT, and CLS are collected by the Lighthouse workflow.

## Summary

| Page | Local Requests | External Requests | Total Requests | Local Bytes | CSS | JS | Images | Fonts | Data | Partials | Audio | Other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 24 | 3 | 27 | 2.2 MB | 72.4 KB | 23.7 KB | 61.4 KB | 2.0 MB | 28.0 KB | 4.0 KB | 6.5 KB | 300 B |
| projects | 17 | 0 | 17 | 2.1 MB | 72.4 KB | 18.9 KB | 7.1 KB | 2.0 MB | 0 B | 4.0 KB | 0 B | 0 B |
| updates | 18 | 0 | 18 | 2.1 MB | 72.4 KB | 19.4 KB | 7.1 KB | 2.0 MB | 27.4 KB | 4.0 KB | 0 B | 0 B |
| photography | 16 | 0 | 16 | 2.1 MB | 72.4 KB | 25.9 KB | 7.1 KB | 2.0 MB | 612 B | 139 B | 0 B | 0 B |

## Home

- Source page: `index.html`
- Local bytes: `2.2 MB`
- Local requests: `24`
- External requests: `3`
- External URLs:
  - `https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js`
  - `https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css`
  - `https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js`
- Runtime requests discovered from loaded JS:
  - `http://local.test/assets/data/expertise.json`
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `audio`: `6.5 KB`
  - `css`: `72.4 KB`
  - `data`: `28.0 KB`
  - `fonts`: `2.0 MB`
  - `images`: `61.4 KB`
  - `js`: `23.7 KB`
  - `other`: `300 B`
  - `partials`: `4.0 KB`

## Projects

- Source page: `projects/index.html`
- Local bytes: `2.1 MB`
- Local requests: `17`
- External requests: `0`
- Category breakdown:
  - `css`: `72.4 KB`
  - `fonts`: `2.0 MB`
  - `images`: `7.1 KB`
  - `js`: `18.9 KB`
  - `partials`: `4.0 KB`

## Updates

- Source page: `updates/index.html`
- Local bytes: `2.1 MB`
- Local requests: `18`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `css`: `72.4 KB`
  - `data`: `27.4 KB`
  - `fonts`: `2.0 MB`
  - `images`: `7.1 KB`
  - `js`: `19.4 KB`
  - `partials`: `4.0 KB`

## Photography

- Source page: `photography/index.html`
- Local bytes: `2.1 MB`
- Local requests: `16`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/photography/data/photos.json`
- Category breakdown:
  - `css`: `72.4 KB`
  - `data`: `612 B`
  - `fonts`: `2.0 MB`
  - `images`: `7.1 KB`
  - `js`: `25.9 KB`
  - `partials`: `139 B`
