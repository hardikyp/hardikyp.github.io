Publications JSON Guide
=======================

Location
- Preferred split files (recommended):
  - publications/journals.json
  - publications/conferences.json
  - publications/talks.json
- Back‑compat (optional): publications/publications.json (single file). If the three split files are missing, the page falls back to this file.
- Consumed by: assets/js/publications.js on publications/index.html

Top-level shape (all files)
{
  "publications": [ Publication, ... ]
}

Publication fields
- id: string (required, unique)
- year: number (required) — used for grouping and sorting (desc)
- type: string (required) — one of: "journal", "conference", "talk" (drives filter chips). You can add others; they appear under “Other”.
- status: string (optional) — e.g., "under-review", "in-press"; displayed as “(Under review, 2025)”
- title: string (required)
- authors: string[] (required) — order preserved; render: "Last, F., Coauthor, ..."
- venue: string (optional) — journal or conference name or “Under Review”
- volume: number|string (optional)
- issue: number|string (optional)
- pages: string (optional) — e.g., "p.104176" or "pp. 1–12"
- date: string (optional) — ISO preferred (YYYY-MM-DD). Year still controls grouping.
- abstract: string (optional) — shown inside accordion
- keywords: string[] (optional) — shown inside accordion
- links: object (optional) — any of the following keys (URLs):
  - doi, pdf, preprint, slides, video, code, event, site

Links → button priority and styles
- Render order: doi, pdf, preprint, slides, video, code, event, site.
- Styles by position within an item:
  - First: primary
  - Second: secondary
  - Remaining: tertiary

Example
{
  "id": "2025-jfs-sm-hulls",
  "year": 2025,
  "type": "journal",
  "status": "in-press",
  "title": "Shape‑Morphing Hulls for Reconfigurable Vessels",
  "authors": ["Patil, H. Y.", "Coauthor, A."],
  "venue": "Journal of Fluids and Structures",
  "volume": 130,
  "pages": "p.104176",
  "date": "2025-02-01",
  "abstract": "…",
  "keywords": ["shape‑morphing", "hydrodynamics"],
  "links": {"doi": "https://doi.org/...", "pdf": "…", "code": "…"}
}

Editing tips
- Keep valid JSON (double quotes, commas, etc.).
- You can omit optional fields; UI hides them automatically.
- Add as many entries as you like; the page updates on reload.
- In split files, you may omit "type"; it will be inferred from the file (journal/conference/talk).
