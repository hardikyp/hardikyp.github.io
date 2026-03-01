# Design System

Local component library for the personal website.

## Purpose
- Collect all current UI elements in one place.
- Serve as a copy/paste reference for replacing ad hoc UI in existing pages.
- Stay decoupled from production navigation and routes.

## Local-only behavior
- `design-system/index.html` is intentionally hidden unless opened on localhost or file protocol.
- On non-local hosts, the page shows a restricted message.

## How to use
1. Run the site locally.
2. Open `/design-system/index.html`.
3. Copy component markup and reuse existing classes in page-specific HTML/JS templates.

## When adding new components
- Reuse classes from `/assets/css/style.css` when possible.
- Add one section per component family in `design-system/index.html`.
- Add only helper layout styles in `design-system/design-system.css`.
