# Static Performance Baseline

Static asset baseline only. Dynamic browser metrics such as LCP, TBT, and CLS are collected by the Lighthouse workflow.

## Summary

| Page | Local Requests | External Requests | Total Requests | Local Bytes | CSS | JS | Images | Fonts | Data | Partials | Audio | Other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 26 | 0 | 26 | 321.1 KB | 73.7 KB | 39.7 KB | 93.1 KB | 56.2 KB | 28.0 KB | 0 B | 6.5 KB | 300 B |
| projects | 28 | 1 | 29 | 1005.9 KB | 73.7 KB | 30.1 KB | 820.6 KB | 56.2 KB | 0 B | 0 B | 0 B | 0 B |
| updates | 28 | 0 | 28 | 353.3 KB | 73.7 KB | 31.1 KB | 133.2 KB | 56.2 KB | 27.4 KB | 0 B | 0 B | 0 B |
| photography | 16 | 0 | 16 | 173.2 KB | 73.7 KB | 30.2 KB | 7.4 KB | 56.2 KB | 612 B | 0 B | 0 B | 0 B |

## Home

- Source page: `index.html`
- Local bytes: `321.1 KB`
- Local requests: `26`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/assets/data/expertise.json`
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `audio`: `6.5 KB`
  - `css`: `73.7 KB`
  - `data`: `28.0 KB`
  - `fonts`: `56.2 KB`
  - `images`: `93.1 KB`
  - `js`: `39.7 KB`
  - `other`: `300 B`

## Projects

- Source page: `projects/index.html`
- Local bytes: `1005.9 KB`
- Local requests: `28`
- External requests: `1`
- External URLs:
  - `https://placehold.net/8-800x600.png`
- Category breakdown:
  - `css`: `73.7 KB`
  - `fonts`: `56.2 KB`
  - `images`: `820.6 KB`
  - `js`: `30.1 KB`

## Updates

- Source page: `updates/index.html`
- Local bytes: `353.3 KB`
- Local requests: `28`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `css`: `73.7 KB`
  - `data`: `27.4 KB`
  - `fonts`: `56.2 KB`
  - `images`: `133.2 KB`
  - `js`: `31.1 KB`

## Photography

- Source page: `photography/index.html`
- Local bytes: `173.2 KB`
- Local requests: `16`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/photography/data/photos.json`
- Category breakdown:
  - `css`: `73.7 KB`
  - `data`: `612 B`
  - `fonts`: `56.2 KB`
  - `images`: `7.4 KB`
  - `js`: `30.2 KB`
