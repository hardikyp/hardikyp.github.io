# Static Performance Baseline

Static asset baseline only. Dynamic browser metrics such as LCP, TBT, and CLS are collected by the Lighthouse workflow.

## Summary

| Page | Local Requests | External Requests | Total Requests | Local Bytes | CSS | JS | Images | Fonts | Data | Partials | Audio | Other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 26 | 0 | 26 | 327.6 KB | 74.2 KB | 45.5 KB | 93.1 KB | 56.2 KB | 28.0 KB | 0 B | 6.5 KB | 300 B |
| projects | 28 | 1 | 29 | 1011.6 KB | 74.2 KB | 35.3 KB | 820.6 KB | 56.2 KB | 0 B | 0 B | 0 B | 0 B |
| updates | 28 | 0 | 28 | 358.8 KB | 74.2 KB | 36.3 KB | 133.2 KB | 56.2 KB | 27.4 KB | 0 B | 0 B | 0 B |
| photography | 17 | 0 | 17 | 188.9 KB | 74.2 KB | 45.4 KB | 7.4 KB | 56.2 KB | 627 B | 0 B | 0 B | 0 B |

## Home

- Source page: `index.html`
- Local bytes: `327.6 KB`
- Local requests: `26`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/assets/data/expertise.json`
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `audio`: `6.5 KB`
  - `css`: `74.2 KB`
  - `data`: `28.0 KB`
  - `fonts`: `56.2 KB`
  - `images`: `93.1 KB`
  - `js`: `45.5 KB`
  - `other`: `300 B`

## Projects

- Source page: `projects/index.html`
- Local bytes: `1011.6 KB`
- Local requests: `28`
- External requests: `1`
- External URLs:
  - `https://placehold.net/8-800x600.png`
- Category breakdown:
  - `css`: `74.2 KB`
  - `fonts`: `56.2 KB`
  - `images`: `820.6 KB`
  - `js`: `35.3 KB`

## Updates

- Source page: `updates/index.html`
- Local bytes: `358.8 KB`
- Local requests: `28`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `css`: `74.2 KB`
  - `data`: `27.4 KB`
  - `fonts`: `56.2 KB`
  - `images`: `133.2 KB`
  - `js`: `36.3 KB`

## Photography

- Source page: `photography/index.html`
- Local bytes: `188.9 KB`
- Local requests: `17`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/photography/data/photos.json`
- Category breakdown:
  - `css`: `74.2 KB`
  - `data`: `627 B`
  - `fonts`: `56.2 KB`
  - `images`: `7.4 KB`
  - `js`: `45.4 KB`
