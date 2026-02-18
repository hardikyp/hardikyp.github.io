# Teaching Data Guide

Edit `/teaching/data/teaching.json` to update this page.

## Top-level keys

- `hero`: page title and intro subtitle
- `philosophy`: visual philosophy block content
- `experiences`: list of teaching roles

## Philosophy fields

The `philosophy` object supports:

- `title`: section title
- `headline`: compact statement (1-2 lines recommended)
- `principles`: short list rendered as chips
- `outcomeLine`: short outcome sentence
- `image.src`: featured image path
- `image.alt`: image alt text

## Experience fields

Each item in `experiences` supports:

- `slug`: unique id used by `/teaching/view.html?slug=...`
- `courseNumber`: short code (example: `CEE 211`)
- `courseTitle`: full course title
- `university`: institution name
- `year`: year shown on card
- `card.summary`: short card description (kept to two lines in UI)
- `card.image`: card thumbnail/image path
- `card.alt`: image alt text
- `detail.body`: full HTML content shown on the detail view page
