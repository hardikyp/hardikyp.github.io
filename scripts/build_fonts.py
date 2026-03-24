#!/usr/bin/env python3
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
TEXT_SUFFIXES = {".html", ".css", ".js", ".json", ".md", ".txt", ".xml", ".webmanifest"}
FONT_BUILDS = [
    {
        "source": ROOT / "assets/fonts/Manrope/Manrope-VariableFont_wght.ttf",
        "output": ROOT / "assets/fonts/Manrope/Manrope-VariableFont_wght.woff2",
    },
    {
        "source": ROOT / "assets/fonts/Montserrat/Montserrat-VariableFont_wght.ttf",
        "output": ROOT / "assets/fonts/Montserrat/Montserrat-VariableFont_wght.woff2",
    },
]


def iter_text_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if any(part in {".git", "__pycache__"} for part in path.parts):
            continue
        files.append(path)
    return files


def build_charset() -> str:
    chars = {" ", "\n", "\r", "\t"}
    for path in iter_text_files():
        try:
            chars.update(path.read_text(encoding="utf-8"))
        except UnicodeDecodeError:
            continue
    ordered = "".join(sorted(chars))
    return ordered


def find_pyftsubset() -> str:
    env_override = os.environ.get("PYFTSUBSET_BIN")
    if env_override:
        return env_override
    path = shutil.which("pyftsubset")
    if not path:
        raise SystemExit(
            "pyftsubset was not found on PATH. Install fonttools with brotli and rerun, "
            "or set PYFTSUBSET_BIN."
        )
    return path


def human_bytes(size: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.1f} {unit}" if unit != "B" else f"{int(value)} B"
        value /= 1024
    return f"{size} B"


def build_font(pyftsubset: str, source: Path, output: Path, text_file: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    command = [
        pyftsubset,
        str(source),
        f"--text-file={text_file}",
        "--flavor=woff2",
        "--layout-features=*",
        "--passthrough-tables",
        "--no-hinting",
        f"--output-file={output}",
    ]
    subprocess.run(command, check=True, cwd=ROOT)


def main() -> int:
    pyftsubset = find_pyftsubset()
    charset = build_charset()
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as handle:
        handle.write(charset)
        text_path = Path(handle.name)
    try:
        for build in FONT_BUILDS:
            source = build["source"]
            output = build["output"]
            before = source.stat().st_size
            build_font(pyftsubset, source, output, text_path)
            after = output.stat().st_size
            print(
                f"{output.relative_to(ROOT)}: "
                f"{human_bytes(before)} -> {human_bytes(after)}"
            )
    finally:
        text_path.unlink(missing_ok=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
