#!/usr/bin/env python3
"""Generate sitemap.xml from static pages and JSON-backed dynamic pages."""

from __future__ import annotations

import datetime as dt
import glob
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATH = ROOT / "sitemap.xml"
SITE_URL = "https://hardikpatil.com"


def iso_date_from_mtime(path: Path) -> str:
    return dt.datetime.fromtimestamp(path.stat().st_mtime, dt.timezone.utc).date().isoformat()


def add_url(urls: dict[str, str], loc: str, lastmod: str) -> None:
    urls[loc] = lastmod


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    urls: dict[str, str] = {}

    static_routes = [
        ("/", ROOT / "index.html"),
        ("/projects/", ROOT / "projects" / "index.html"),
        ("/publications/", ROOT / "publications" / "index.html"),
        ("/updates/", ROOT / "updates" / "index.html"),
        ("/photography/", ROOT / "photography" / "index.html"),
        ("/teaching/", ROOT / "teaching" / "index.html"),
    ]

    for route, source in static_routes:
        if source.exists():
            add_url(urls, f"{SITE_URL}{route}", iso_date_from_mtime(source))

    updates_data = ROOT / "updates" / "data" / "updates.json"
    if updates_data.exists():
        updates = load_json(updates_data).get("updates", [])
        fallback = iso_date_from_mtime(updates_data)
        for item in updates:
            slug = item.get("slug")
            if not slug:
                continue
            lastmod = item.get("date") or fallback
            add_url(
                urls,
                f"{SITE_URL}/updates/{slug}/",
                str(lastmod),
            )

    project_files = [Path(p) for p in glob.glob(str(ROOT / "projects" / "data" / "*.json"))]
    for project_file in project_files:
        data = load_json(project_file)
        lastmod = iso_date_from_mtime(project_file)
        for item in data.get("projects", []):
            slug = item.get("slug")
            if not slug:
                continue
            add_url(
                urls,
                f"{SITE_URL}/projects/{slug}/",
                lastmod,
            )

    teaching_data = ROOT / "teaching" / "data" / "teaching.json"
    if teaching_data.exists():
        data = load_json(teaching_data)
        lastmod = iso_date_from_mtime(teaching_data)
        for item in data.get("experiences", []):
            slug = item.get("slug")
            if not slug:
                continue
            add_url(
                urls,
                f"{SITE_URL}/teaching/{slug}/",
                lastmod,
            )

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc in sorted(urls):
        lines.append(f"  <url><loc>{loc}</loc><lastmod>{urls[loc]}</lastmod></url>")
    lines.append("</urlset>")
    SITEMAP_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
