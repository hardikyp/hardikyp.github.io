# Static Performance Baseline

Static asset baseline only. Dynamic browser metrics such as LCP, TBT, and CLS are collected by the Lighthouse workflow.

## Summary

| Page | Local Requests | External Requests | Total Requests | Local Bytes | CSS | JS | Images | Fonts | Data | Partials | Audio | Other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 21 | 0 | 21 | 2.2 MB | 73.3 KB | 22.0 KB | 61.4 KB | 2.0 MB | 28.0 KB | 0 B | 6.5 KB | 300 B |
| projects | 14 | 0 | 14 | 2.1 MB | 73.3 KB | 13.6 KB | 7.1 KB | 2.0 MB | 0 B | 0 B | 0 B | 0 B |
| updates | 15 | 0 | 15 | 2.1 MB | 73.3 KB | 14.1 KB | 7.1 KB | 2.0 MB | 27.4 KB | 0 B | 0 B | 0 B |
| photography | 15 | 0 | 15 | 2.1 MB | 73.3 KB | 20.6 KB | 7.1 KB | 2.0 MB | 612 B | 0 B | 0 B | 0 B |

## Home

- Source page: `index.html`
- Local bytes: `2.2 MB`
- Local requests: `21`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/assets/data/expertise.json`
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `audio`: `6.5 KB`
  - `css`: `73.3 KB`
  - `data`: `28.0 KB`
  - `fonts`: `2.0 MB`
  - `images`: `61.4 KB`
  - `js`: `22.0 KB`
  - `other`: `300 B`

## Projects

- Source page: `projects/index.html`
- Local bytes: `2.1 MB`
- Local requests: `14`
- External requests: `0`
- Category breakdown:
  - `css`: `73.3 KB`
  - `fonts`: `2.0 MB`
  - `images`: `7.1 KB`
  - `js`: `13.6 KB`

## Updates

- Source page: `updates/index.html`
- Local bytes: `2.1 MB`
- Local requests: `15`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `css`: `73.3 KB`
  - `data`: `27.4 KB`
  - `fonts`: `2.0 MB`
  - `images`: `7.1 KB`
  - `js`: `14.1 KB`

## Photography

- Source page: `photography/index.html`
- Local bytes: `2.1 MB`
- Local requests: `15`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/photography/data/photos.json`
- Category breakdown:
  - `css`: `73.3 KB`
  - `data`: `612 B`
  - `fonts`: `2.0 MB`
  - `images`: `7.1 KB`
  - `js`: `20.6 KB`
