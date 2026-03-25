# Projects: Data-Driven Setup

This folder powers the Projects section using JSON files per category plus a build-time renderer.

- Listing: `projects/index.html` ships pre-rendered project cards and a JS-enhanced type filter.
- Detail pages: `projects/<slug>/index.html` are generated from the JSON data.
- Fallback detail shell: `projects/view.html?slug=<slug>` can still render a single project from the JSONs when needed.
- Scripts:
  - `assets/js/projects.js` (listing + type filter)
  - `assets/js/project-detail.js` (detail page)
  - `scripts/prerender_content.py` (build-time HTML generation)

## Where to Add Projects

Use one JSON file per category under `projects/data/`:
- `research.json` — Research projects
- `courses.json` — Course projects
- `internships.json` — Internship projects
- `others.json` — Miscellaneous

You can add more categories by creating another `projects/data/<category>.json` and (optionally) wiring it in `assets/js/projects.js` (the `sources` array).

## JSON Schema (per project)

Required:
- `slug` (string, unique)
- `title` (string)
- `summary` (string; 1–2 lines shown on card hover)
- `card.image` (string; preview image for the card)

Recommended:
- `years` (string; e.g., `2023–present` or `Summer 2023`)

Optional (used by the detail page):
- `detail.body` (HTML string) — full project content (paragraphs, lists, links)
- `detail.images[]` (array of `{ src, alt }`) — additional images for the gallery at top
- `card.alt` (string) — alt text for the card image

Example:
```
{
  "slug": "deployable-bridges",
  "title": "Deployable Bridges: Kinematics to Nonlinear Mechanics",
  "years": "2023–present",
  "summary": "End-to-end workflow for adaptive, quickly deployable bridge systems.",
  "card": { "image": "/assets/img/updates/publication.svg", "alt": "Bridge graphic" },
  "detail": {
    "images": [ { "src": "/assets/img/updates/publication.svg", "alt": "Bridge" } ],
    "body": "<p>Longer write-up with figures and references ...</p>"
  }
}
```

## Adding a New Category

1) Create `projects/data/<category>.json` with `{ "projects": [ ... ] }`.
2) Add to the `sources` array in `assets/js/projects.js`:
```
{ type: 'MyCategory', url: '/projects/data/<category>.json' }
```
The filter chips will include the new type and the grid will render its cards.

## Linking & Detail Pages

- Shipped cards should link to `/projects/<slug>/`.
- Generated detail pages are built from the JSON files by `scripts/prerender_content.py`.
- The fallback detail shell still searches all category JSONs for the `slug` and renders title, type, years, images, and body/summary content when the generated route is unavailable.

## Styling Notes

- Card image: use a 16:9 or similar landscape ratio for best results.
- Hover text (`summary`): keep it to 1–2 lines for a clean reveal.
- Accessibility: provide `card.alt` and descriptive `detail.images[].alt`.
