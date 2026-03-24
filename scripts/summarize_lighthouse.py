#!/usr/bin/env python3
"""Summarize Lighthouse JSON reports into a compact Markdown table."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def ms(value: float | int | None) -> str:
    if value is None:
        return "n/a"
    return f"{float(value):.0f} ms"


def seconds(value: float | int | None) -> str:
    if value is None:
        return "n/a"
    return f"{float(value) / 1000:.2f} s"


def cls(value: float | int | None) -> str:
    if value is None:
        return "n/a"
    return f"{float(value):.3f}"


def load_report(path: Path) -> dict[str, object]:
    data = json.loads(path.read_text(encoding="utf-8"))
    audits = data.get("audits", {})
    perf = data.get("categories", {}).get("performance", {})
    requests = audits.get("network-requests", {}).get("details", {}).get("items", [])
    transfer_size = 0
    if isinstance(requests, list):
        transfer_size = sum(item.get("transferSize", 0) for item in requests if isinstance(item, dict))
    return {
        "name": path.stem,
        "score": perf.get("score"),
        "lcp": audits.get("largest-contentful-paint", {}).get("numericValue"),
        "tbt": audits.get("total-blocking-time", {}).get("numericValue"),
        "cls": audits.get("cumulative-layout-shift", {}).get("numericValue"),
        "transfer_size": transfer_size,
        "request_count": len(requests) if isinstance(requests, list) else None,
    }


def pretty_bytes(size: int | None) -> str:
    if size is None:
        return "n/a"
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Summarize Lighthouse JSON reports.")
    parser.add_argument("--input-dir", required=True, help="Directory containing Lighthouse JSON files")
    parser.add_argument("--output", required=True, help="Markdown output path")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output = Path(args.output)
    reports = [load_report(path) for path in sorted(input_dir.glob("*.json"))]

    lines = [
        "# Lighthouse Summary",
        "",
        "| Page | Perf Score | LCP | TBT | CLS | Transfer Size | Requests |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for report in reports:
        score = report["score"]
        score_text = f"{round(float(score) * 100):.0f}" if score is not None else "n/a"
        lines.append(
            "| {name} | {score} | {lcp} | {tbt} | {cls} | {transfer} | {requests} |".format(
                name=report["name"],
                score=score_text,
                lcp=seconds(report["lcp"]),
                tbt=ms(report["tbt"]),
                cls=cls(report["cls"]),
                transfer=pretty_bytes(report["transfer_size"]),
                requests=report["request_count"] if report["request_count"] is not None else "n/a",
            )
        )

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
