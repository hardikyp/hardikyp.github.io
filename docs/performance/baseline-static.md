# Static Performance Baseline

Static asset baseline only. Dynamic browser metrics such as LCP, TBT, and CLS are collected by the Lighthouse workflow.

## Summary

| Page | Local Requests | External Requests | Total Requests | Local Bytes | CSS | JS | Images | Fonts | Data | Partials | Audio | Other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 21 | 0 | 21 | 277.8 KB | 73.3 KB | 32.8 KB | 61.4 KB | 56.2 KB | 28.0 KB | 0 B | 6.5 KB | 300 B |
| projects | 14 | 0 | 14 | 169.0 KB | 73.3 KB | 24.2 KB | 7.1 KB | 56.2 KB | 0 B | 0 B | 0 B | 0 B |
| updates | 15 | 0 | 15 | 197.4 KB | 73.3 KB | 24.5 KB | 7.1 KB | 56.2 KB | 27.4 KB | 0 B | 0 B | 0 B |
| photography | 15 | 0 | 15 | 172.6 KB | 73.3 KB | 30.2 KB | 7.1 KB | 56.2 KB | 612 B | 0 B | 0 B | 0 B |

## Home

- Source page: `index.html`
- Local bytes: `277.8 KB`
- Local requests: `21`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/assets/data/expertise.json`
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `audio`: `6.5 KB`
  - `css`: `73.3 KB`
  - `data`: `28.0 KB`
  - `fonts`: `56.2 KB`
  - `images`: `61.4 KB`
  - `js`: `32.8 KB`
  - `other`: `300 B`

## Projects

- Source page: `projects/index.html`
- Local bytes: `169.0 KB`
- Local requests: `14`
- External requests: `0`
- Category breakdown:
  - `css`: `73.3 KB`
  - `fonts`: `56.2 KB`
  - `images`: `7.1 KB`
  - `js`: `24.2 KB`

## Updates

- Source page: `updates/index.html`
- Local bytes: `197.4 KB`
- Local requests: `15`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/updates/data/updates.json`
- Category breakdown:
  - `css`: `73.3 KB`
  - `data`: `27.4 KB`
  - `fonts`: `56.2 KB`
  - `images`: `7.1 KB`
  - `js`: `24.5 KB`

## Photography

- Source page: `photography/index.html`
- Local bytes: `172.6 KB`
- Local requests: `15`
- External requests: `0`
- Runtime requests discovered from loaded JS:
  - `http://local.test/photography/data/photos.json`
- Category breakdown:
  - `css`: `73.3 KB`
  - `data`: `612 B`
  - `fonts`: `56.2 KB`
  - `images`: `7.1 KB`
  - `js`: `30.2 KB`
