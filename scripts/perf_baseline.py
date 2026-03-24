#!/usr/bin/env python3
"""Generate a lightweight static performance baseline for key site pages.

This script is intentionally stdlib-only so it can run locally and in CI
without introducing a package manager or heavier runtime dependencies.

It measures the static asset graph that is directly reachable from each page:
- HTML document bytes
- local request count
- external request count
- CSS / JS / image / font / data / partial bytes

It also scans loaded JS files for literal `fetch("...")` and `loadJSON("...")`
calls so JSON and partial requests that happen at runtime are still visible in
the report. It does not attempt to emulate a browser or execute scripts.
Dynamic browser metrics such as LCP, TBT, and CLS are captured separately by
the Lighthouse workflow.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

SITE_ORIGIN = "http://local.test/"
DEFAULT_PAGES = [
    {"name": "home", "path": "index.html", "url": f"{SITE_ORIGIN}index.html"},
    {"name": "projects", "path": "projects/index.html", "url": f"{SITE_ORIGIN}projects/index.html"},
    {"name": "updates", "path": "updates/index.html", "url": f"{SITE_ORIGIN}updates/index.html"},
    {"name": "photography", "path": "photography/index.html", "url": f"{SITE_ORIGIN}photography/index.html"},
]
FETCH_RE = re.compile(r"""(?:fetch|loadJSON)\(\s*['"]([^'"]+)['"]""")
URL_RE = re.compile(r"""url\(\s*(['"]?)([^'")]+)\1\s*\)""")
IMPORT_RE = re.compile(r"""@import\s+(?:url\(\s*)?['"]?([^'")\s]+)""")


def pretty_bytes(size: int) -> str:
    value = float(size)
    units = ["B", "KB", "MB", "GB"]
    unit = units[0]
    for unit in units:
        if value < 1024 or unit == units[-1]:
            break
        value /= 1024
    if unit == "B":
        return f"{int(value)} {unit}"
    return f"{value:.1f} {unit}"


def is_skippable_url(raw: str) -> bool:
    if not raw:
        return True
    raw = raw.strip()
    return raw.startswith(("#", "mailto:", "tel:", "javascript:", "data:"))


def is_external_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in {"http", "https"} and parsed.netloc not in {"", "local.test"}


def url_to_repo_path(root: Path, url: str) -> Path | None:
    parsed = urlparse(url)
    if parsed.scheme not in {"", "http", "https"}:
        return None
    if parsed.netloc and parsed.netloc != "local.test":
        return None
    path = parsed.path or "/"
    if path == "/":
        path = "/index.html"
    return root / path.lstrip("/")


def categorize_path(path: str) -> str:
    lowered = path.lower()
    suffix = Path(lowered).suffix
    if lowered.endswith(".html"):
        return "partials" if "assets/partials/" in lowered else "html"
    if suffix == ".css":
        return "css"
    if suffix == ".js":
        return "js"
    if suffix in {".woff", ".woff2", ".ttf", ".otf"}:
        return "fonts"
    if suffix in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"}:
        return "images"
    if suffix in {".json"}:
        return "data"
    if suffix in {".mp3", ".wav", ".ogg", ".m4a"}:
        return "audio"
    return "other"


@dataclass
class AssetRef:
    resolved_url: str
    source: str


class PageHTMLParser(HTMLParser):
    def __init__(self, doc_url: str) -> None:
        super().__init__()
        self.doc_url = doc_url
        self.base_href = ""
        self.assets: list[AssetRef] = []

    def resolve(self, raw: str) -> str | None:
        if is_skippable_url(raw):
            return None
        base = urljoin(self.doc_url, self.base_href or "")
        return urljoin(base, raw.strip())

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key: value or "" for key, value in attrs}
        if tag == "base" and attr_map.get("href"):
            self.base_href = attr_map["href"]
            return

        if attr_map.get("data-include"):
            resolved = self.resolve(attr_map["data-include"])
            if resolved:
                self.assets.append(AssetRef(resolved, "data-include"))

        if tag == "script" and attr_map.get("src"):
            resolved = self.resolve(attr_map["src"])
            if resolved:
                self.assets.append(AssetRef(resolved, "script"))

        if tag == "link" and attr_map.get("href"):
            rel = {item.strip().lower() for item in attr_map.get("rel", "").split()}
            if rel.intersection({"stylesheet", "preload", "icon", "manifest", "apple-touch-icon"}):
                resolved = self.resolve(attr_map["href"])
                if resolved:
                    self.assets.append(AssetRef(resolved, "link"))

        if tag in {"img", "audio", "video", "source"} and attr_map.get("src"):
            resolved = self.resolve(attr_map["src"])
            if resolved:
                self.assets.append(AssetRef(resolved, tag))


def parse_css_assets(css_text: str, css_url: str) -> list[str]:
    urls: list[str] = []
    for match in IMPORT_RE.finditer(css_text):
        raw = match.group(1).strip()
        if not is_skippable_url(raw):
            urls.append(urljoin(css_url, raw))
    for match in URL_RE.finditer(css_text):
        raw = match.group(2).strip()
        if not is_skippable_url(raw):
            urls.append(urljoin(css_url, raw))
    return urls


def parse_js_runtime_requests(js_text: str, document_url: str) -> list[str]:
    urls: list[str] = []
    for match in FETCH_RE.finditer(js_text):
        raw = match.group(1).strip()
        if not is_skippable_url(raw):
            urls.append(urljoin(document_url, raw))
    return urls


def load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def analyze_page(root: Path, page: dict[str, str]) -> dict[str, object]:
    page_path = root / page["path"]
    page_url = page["url"]
    html_text = load_text(page_path)
    parser = PageHTMLParser(page_url)
    parser.feed(html_text)

    local_assets: set[str] = set()
    external_assets: set[str] = set()
    missing_assets: set[str] = set()
    css_queue: list[str] = []
    js_queue: list[str] = []
    runtime_requests: set[str] = set()
    category_bytes: dict[str, int] = defaultdict(int)
    category_paths: dict[str, set[str]] = defaultdict(set)

    def record_asset(url: str) -> None:
        if is_external_url(url):
            external_assets.add(url)
            return
        asset_path = url_to_repo_path(root, url)
        if asset_path is None:
            return
        normalized = str(asset_path.relative_to(root)).replace("\\", "/")
        if normalized in local_assets:
            return
        local_assets.add(normalized)
        if not asset_path.exists():
            missing_assets.add(normalized)
            return
        category = categorize_path(normalized)
        category_paths[category].add(normalized)
        category_bytes[category] += asset_path.stat().st_size
        if normalized.endswith(".css"):
            css_queue.append(url)
        if normalized.endswith(".js"):
            js_queue.append(url)

    document_base_url = urljoin(page_url, parser.base_href or "")

    for asset in parser.assets:
        record_asset(asset.resolved_url)

    seen_css: set[str] = set()
    while css_queue:
        css_url = css_queue.pop()
        if css_url in seen_css:
            continue
        seen_css.add(css_url)
        css_path = url_to_repo_path(root, css_url)
        if css_path is None or not css_path.exists():
            continue
        css_text = load_text(css_path)
        for child_url in parse_css_assets(css_text, css_url):
            record_asset(child_url)

    seen_js: set[str] = set()
    while js_queue:
        js_url = js_queue.pop()
        if js_url in seen_js:
            continue
        seen_js.add(js_url)
        js_path = url_to_repo_path(root, js_url)
        if js_path is None or not js_path.exists():
            continue
        js_text = load_text(js_path)
        for child_url in parse_js_runtime_requests(js_text, document_base_url):
            runtime_requests.add(child_url)
            record_asset(child_url)

    html_bytes = page_path.stat().st_size
    total_local_bytes = html_bytes + sum(category_bytes.values())
    total_request_count = 1 + len(local_assets) + len(external_assets)

    return {
        "name": page["name"],
        "path": page["path"],
        "document_bytes": html_bytes,
        "local_request_count": 1 + len(local_assets),
        "external_request_count": len(external_assets),
        "total_request_count": total_request_count,
        "local_total_bytes": total_local_bytes,
        "category_bytes": dict(sorted(category_bytes.items())),
        "category_paths": {key: sorted(value) for key, value in sorted(category_paths.items())},
        "runtime_requests": sorted(runtime_requests),
        "external_requests": sorted(external_assets),
        "missing_assets": sorted(missing_assets),
    }


def make_summary(results: list[dict[str, object]]) -> dict[str, object]:
    return {
        "pages": results,
        "generated_note": (
            "Static asset baseline only. Dynamic browser metrics such as LCP, TBT, and CLS "
            "are collected by the Lighthouse workflow."
        ),
    }


def write_markdown(summary: dict[str, object], path: Path) -> None:
    lines: list[str] = []
    lines.append("# Static Performance Baseline")
    lines.append("")
    lines.append(summary["generated_note"])
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append("| Page | Local Requests | External Requests | Total Requests | Local Bytes | CSS | JS | Images | Fonts | Data | Partials | Audio | Other |")
    lines.append("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |")
    for page in summary["pages"]:
        category_bytes = page["category_bytes"]
        lines.append(
            "| {name} | {local_request_count} | {external_request_count} | {total_request_count} | {local_total_bytes} | {css} | {js} | {images} | {fonts} | {data} | {partials} | {audio} | {other} |".format(
                name=page["name"],
                local_request_count=page["local_request_count"],
                external_request_count=page["external_request_count"],
                total_request_count=page["total_request_count"],
                local_total_bytes=pretty_bytes(page["local_total_bytes"]),
                css=pretty_bytes(category_bytes.get("css", 0)),
                js=pretty_bytes(category_bytes.get("js", 0)),
                images=pretty_bytes(category_bytes.get("images", 0)),
                fonts=pretty_bytes(category_bytes.get("fonts", 0)),
                data=pretty_bytes(category_bytes.get("data", 0)),
                partials=pretty_bytes(category_bytes.get("partials", 0)),
                audio=pretty_bytes(category_bytes.get("audio", 0)),
                other=pretty_bytes(category_bytes.get("other", 0)),
            )
        )

    for page in summary["pages"]:
        lines.append("")
        lines.append(f"## {page['name'].title()}")
        lines.append("")
        lines.append(f"- Source page: `{page['path']}`")
        lines.append(f"- Local bytes: `{pretty_bytes(page['local_total_bytes'])}`")
        lines.append(f"- Local requests: `{page['local_request_count']}`")
        lines.append(f"- External requests: `{page['external_request_count']}`")
        if page["external_requests"]:
            lines.append("- External URLs:")
            for url in page["external_requests"]:
                lines.append(f"  - `{url}`")
        if page["runtime_requests"]:
            lines.append("- Runtime requests discovered from loaded JS:")
            for url in page["runtime_requests"]:
                lines.append(f"  - `{url}`")
        if page["missing_assets"]:
            lines.append("- Missing assets:")
            for asset in page["missing_assets"]:
                lines.append(f"  - `{asset}`")
        lines.append("- Category breakdown:")
        for category, size in page["category_bytes"].items():
            lines.append(f"  - `{category}`: `{pretty_bytes(size)}`")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a static performance baseline report.")
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--json-out", required=True, help="Path to write JSON output")
    parser.add_argument("--md-out", required=True, help="Path to write Markdown output")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    results = [analyze_page(root, page) for page in DEFAULT_PAGES]
    summary = make_summary(results)

    json_path = (root / args.json_out).resolve()
    md_path = (root / args.md_out).resolve()
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    write_markdown(summary, md_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
