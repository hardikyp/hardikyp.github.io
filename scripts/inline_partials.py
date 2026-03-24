#!/usr/bin/env python3
"""Synchronize shared partial markup into HTML pages.

This repository ships static HTML directly, so shared chrome needs to exist in
the final HTML files instead of being fetched at runtime. The partial files in
`assets/partials/` remain the source of truth; this script copies their markup
into managed blocks inside the page HTML files.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTIALS = {
    "header": ROOT / "assets/partials/header.html",
    "footer": ROOT / "assets/partials/footer.html",
    "back-to-top": ROOT / "assets/partials/back-to-top.html",
}
HTML_GLOBS = [
    "*.html",
    "projects/*.html",
    "publications/*.html",
    "updates/*.html",
    "teaching/*.html",
    "photography/*.html",
    "design-system/*.html",
]
SITE_ATTR_RE = re.compile(r'(?P<attr>\b(?:href|src)\s*=\s*")/(?P<value>[^"]*)"')


def indent_block(block: str, indent: str) -> str:
    return "\n".join(f"{indent}{line}" if line else "" for line in block.splitlines())


def load_partial_markup() -> dict[str, str]:
    return {name: path.read_text(encoding="utf-8").rstrip() for name, path in PARTIALS.items()}


def relativize_markup(markup: str) -> str:
    def repl(match: re.Match[str]) -> str:
        value = match.group("value")
        if value == "":
            replacement = "index.html"
        elif value.startswith("#"):
            replacement = f"index.html{value}"
        else:
            replacement = value
        return f'{match.group("attr")}{replacement}"'

    return SITE_ATTR_RE.sub(repl, markup)


def build_replacement(name: str, indent: str, markup: str) -> str:
    rendered = indent_block(markup, indent)
    return (
        f"{indent}<!-- partial-sync:{name}:start -->\n"
        f"{rendered}\n"
        f"{indent}<!-- partial-sync:{name}:end -->"
    )


def sync_partial(name: str, text: str, markup: str) -> tuple[str, bool]:
    escaped_name = re.escape(name)
    marker_re = re.compile(
        rf"(?P<indent>^[ \t]*)<!-- partial-sync:{escaped_name}:start -->\n"
        rf".*?"
        rf"^[ \t]*<!-- partial-sync:{escaped_name}:end -->",
        re.MULTILINE | re.DOTALL,
    )
    placeholder_re = re.compile(
        rf"(?P<indent>^[ \t]*)<div data-include=\"/assets/partials/{escaped_name}\.html\"></div>$",
        re.MULTILINE,
    )

    match = marker_re.search(text)
    if match:
        indent = match.group("indent")
        replacement = build_replacement(name, indent, markup)
        updated = marker_re.sub(replacement, text, count=1)
        return updated, updated != text

    match = placeholder_re.search(text)
    if match:
        indent = match.group("indent")
        replacement = build_replacement(name, indent, markup)
        updated = placeholder_re.sub(replacement, text, count=1)
        return updated, True

    return text, False


def iter_html_files(root: Path) -> list[Path]:
    files: list[Path] = []
    seen: set[Path] = set()
    for pattern in HTML_GLOBS:
        for path in root.glob(pattern):
            if path.name.startswith(".") or path.is_dir():
                continue
            if path in seen:
                continue
            seen.add(path)
            files.append(path)
    return sorted(files)


def sync_file(path: Path, partial_markup: dict[str, str]) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original
    changed = False
    for name, markup in partial_markup.items():
        page_markup = relativize_markup(markup)
        updated, did_change = sync_partial(name, updated, page_markup)
        changed = changed or did_change
    if changed and updated != original:
        path.write_text(updated.rstrip() + "\n", encoding="utf-8")
        return True
    return False


def is_dirty(path: Path, partial_markup: dict[str, str]) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original
    for name, markup in partial_markup.items():
        page_markup = relativize_markup(markup)
        updated, _ = sync_partial(name, updated, page_markup)
    return updated != original


def main() -> int:
    parser = argparse.ArgumentParser(description="Inline shared partial markup into HTML pages.")
    parser.add_argument("--check", action="store_true", help="Exit non-zero if any HTML file is out of sync.")
    args = parser.parse_args()

    partial_markup = load_partial_markup()
    html_files = iter_html_files(ROOT)

    if args.check:
        dirty = [path for path in html_files if is_dirty(path, partial_markup)]
        if dirty:
            for path in dirty:
                print(path.relative_to(ROOT))
            return 1
        return 0

    changed = [path for path in html_files if sync_file(path, partial_markup)]
    for path in changed:
        print(path.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
