# Updates: How to Add New Items

This site renders Updates from a single JSON file and generates per-item HTML at build time. No hand-authored per-item HTML files are required.

## Overview

- Listing page: `updates/index.html`
  - Ships pre-rendered updates from `updates/data/updates.json`.
  - Script: `assets/js/updates.js` (includes lightweight schema validation).
- Detail pages: `updates/<slug>/index.html`
  - Generated from `updates/data/updates.json` by `scripts/prerender_content.py`.
- Fallback detail shell: `updates/view.html`
  - Renders a single update selected by `?slug=...` using the same JSON when needed.
  - Script: `assets/js/update-detail.js`.
- Home page preview
  - Ships the latest three pre-rendered updates on the home page.
  - Script: `assets/js/home-updates.js` is now fallback-only if pre-rendered markup is absent.

## Where to add updates

Edit `updates/data/updates.json`. Each entry in the `updates` array is one update.

### Minimal schema

Required fields:
- `slug` (string, unique)
- `title` (string)
- `date` (string, `YYYY-MM-DD`)
- `image.src` (string, path to image)

Optional fields:
- `tag` (one of: `Award`, `Publication`, `Milestone`, `Other`)
- `image.alt` (string)
- `detail` (HTML string, strongly recommended) — rich content for the detail page; the first paragraph is also used to build listing/home excerpts
- `gallery[]` (array) — extra images for the detail page only, each item `{ "src": "...", "alt": "...", "caption": "optional" }`
- `url` (string) — external or custom link; if omitted, the site links to `/updates/<slug>/`

> Listing cards now derive their excerpt text from the `detail` field, so include at least one paragraph of copy there for each entry.

### Example entry

```
{
  "slug": "nsf-grfp",
  "title": "NSF Graduate Research Fellowship Awarded",
  "tag": "Award",
  "date": "2025-03-18",
  "image": { "src": "/assets/img/updates/award.svg", "alt": "Award illustration" }
}
```

With a custom body:

```
{
  "slug": "emi-paper",
  "title": "Deployable Bridges Paper Accepted to ASCE EMI 2025",
  "tag": "Publication",
  "date": "2025-02-10",
  "detail": "<p>Our manuscript details a new workflow that couples kinematics with nonlinear analysis...</p>",
  "gallery": [
    { "src": "/assets/img/updates/publication.svg", "alt": "Publication icon", "caption": "Workflow summary" }
  ],
  "image": { "src": "/assets/img/updates/publication.svg", "alt": "Publication icon" }
}
```

## Validation rules (applied in the browser)

- `slug` must be a non‑empty string.
- `title` must be a non‑empty string.
- `date` must match `YYYY-MM-DD`.
- `tag` (if present) must be one of: `Award`, `Publication`, `Milestone`, `Other`.
- `image.src` must be a string.
- Invalid items are skipped, and a warning is printed to the console (`[updates] invalid item ...`).

## How links are generated

- If `url` is omitted, shipped links point to `/updates/<slug>/`.
- If `url` is present, it is used as-is (handy for external articles or custom pages).

## Quick add (optional helper)

Open the Updates page with `?admin=1`:

- `https://<your-site>/updates/?admin=1`

This shows a simple generator form (from `assets/js/update-generator.js`) that:
- Produces a JSON block to paste into `updates/data/updates.json`.
- (Optional) It can also generate a static item page HTML, but that’s no longer needed if you use `view.html` with `body` in JSON.

### Securing the helper

The helper never writes to the server — it only generates copy‑paste content — but you may still want to hide it:

- Local‑only default: without configuration, the helper only appears on `localhost`.
- Passphrase gate (optional):
  1. Copy `assets/js/update-admin-config.example.js` to `assets/js/update-admin-config.js`.
  2. Generate a SHA‑256 hash for your passphrase (see comments in the file) and set `window.UPDATES_ADMIN_HASH = 'sha256:<hash>'`.
  3. Ship `update-admin-config.js` with your site. When you visit `?admin=1`, you’ll be prompted for the passphrase.

Note: any client‑side secret can be discovered by a determined user. For stronger protection, use server‑side auth (e.g., HTTP Basic Auth, Cloudflare Access, or a password‑protected route) to gate access to `/updates/?admin=1`.

## Tips

- Keep `slug` unique and URL‑safe (letters, numbers, dashes).
- Prefer adding `image.alt` for accessibility.
- Sorting is by `date` descending; ensure dates are correct.
- The home page automatically shows the latest three entries. Detail text and gallery are rendered into the generated update page and remain available through the fallback view shell.

## Troubleshooting

- Nothing shows up on the Updates page:
  - Check the browser console for `[updates] invalid item` warnings (schema issues).
  - Confirm the JSON is valid (no trailing commas, quotes closed, etc.).
- A detail page shows “Update not found”:
  - Ensure the `slug` in the URL matches an entry in `updates/data/updates.json`.

## Do I need `updates/items/`?

No hand-authored item files are needed. The build script generates `/updates/<slug>/index.html` from the JSON data. Only use `url` if you want to link to an external or custom page instead of the generated update page.
