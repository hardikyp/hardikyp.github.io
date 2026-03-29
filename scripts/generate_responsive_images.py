#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

try:
    from PIL import Image, ImageOps, features
except ImportError as exc:
    raise SystemExit(
        "Pillow is required to generate responsive images. Install it with "
        "`python3 -m pip install pillow` and rerun."
    ) from exc


ROOT = Path(__file__).resolve().parent.parent
SITE_IMAGES_JS = ROOT / "assets/js/site-images.js"
VARIANT_RE = re.compile(
    r"-(?:128|256|320|480|512|640|800|960|1200|1600)(?=\.(?:jpe?g|png)$)",
    re.IGNORECASE,
)
MANAGED_GROUPS = [
    {
        "patterns": ["assets/img/projects/*.[Jj][Pp][Gg]", "assets/img/projects/*.[Pp][Nn][Gg]"],
        "widths": [800, 1200, 1600],
    },
    {
        "patterns": ["assets/img/updates/gallery/*.[Jj][Pp][Gg]", "assets/img/updates/gallery/*.[Pp][Nn][Gg]"],
        "widths": [800, 1200, 1600],
    },
    {
        "patterns": [
            "assets/photography/**/*.[Jj][Pp][Gg]",
            "assets/photography/**/*.[Pp][Nn][Gg]",
        ],
        "widths": [800, 1200, 1600],
    },
    {
        "patterns": [
            "assets/img/updates/thumbnails/*.[Jj][Pp][Gg]",
            "assets/img/updates/thumbnails/*.[Pp][Nn][Gg]",
        ],
        "widths": [128, 256, 512],
    },
    {
        "patterns": ["assets/img/user.png"],
        "widths": [128, 256, 512],
    },
]


HELPER_JS = """(() => {
  const manifest = __MANIFEST__;

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const normalizeSrc = (src = '') => {
    if (!src) return '';
    const trimmed = String(src).trim();
    if (!trimmed) return '';
    if (/^https?:\\/\\//i.test(trimmed)) return trimmed;
    return trimmed
      .replace(/^https?:\\/\\/[^/]+\\//i, '')
      .replace(/^\\.\\//, '')
      .replace(/^\\//, '')
      .replace(/\\\\/g, '/');
  };

  const isManagedRemote = (src = '') => /^https?:\\/\\//i.test(src);
  const splitVariant = (src = '') => {
    const normalized = normalizeSrc(src);
    if (!normalized || isManagedRemote(normalized)) {
      return { key: normalized, width: null };
    }
    const match = normalized.match(/^(.*?)(?:-(128|256|320|480|512|640|800|960|1200|1600))?(\\.(?:jpe?g|png|webp))$/i);
    if (!match) return { key: normalized, width: null };
    const [, stem, width, ext] = match;
    return {
      key: `${stem}${ext.toLowerCase()}`,
      width: width ? Number(width) : null,
    };
  };

  const withVariant = (src, width, ext) => {
    const normalized = normalizeSrc(src);
    if (!normalized || isManagedRemote(normalized)) return normalized;
    const parsed = splitVariant(normalized);
    if (!parsed.key) return normalized;
    const lastDot = parsed.key.lastIndexOf('.');
    const stem = parsed.key.slice(0, lastDot);
    const suffix = ext || parsed.key.slice(lastDot);
    return `${stem}-${width}${suffix}`;
  };

  const toWebpPath = (src) => {
    const normalized = normalizeSrc(src);
    if (!normalized || isManagedRemote(normalized)) return '';
    const parsed = splitVariant(normalized);
    if (!parsed.key) return '';
    const lastDot = parsed.key.lastIndexOf('.');
    const stem = parsed.key.slice(0, lastDot);
    return `${stem}.webp`;
  };

  const getMeta = (src = '') => {
    const normalized = normalizeSrc(src);
    if (!normalized || isManagedRemote(normalized)) return null;
    const parsed = splitVariant(normalized);
    return manifest[parsed.key] || null;
  };

  const getDimensions = (src = '') => {
    const meta = getMeta(src);
    if (!meta) return null;
    return { width: meta.width, height: meta.height };
  };

  const chooseWidth = (availableWidths, preferredWidth) => {
    if (!Array.isArray(availableWidths) || !availableWidths.length) return null;
    const preferred = Number(preferredWidth) || availableWidths[0];
    const largerOrEqual = availableWidths.filter((width) => width >= preferred);
    if (largerOrEqual.length) return Math.min(...largerOrEqual);
    return Math.max(...availableWidths);
  };

  const getPrimarySrc = (src = '', options = {}) => {
    const normalized = normalizeSrc(src);
    const meta = getMeta(normalized);
    if (!meta) return normalized;
    const format = options.format === 'webp' ? '.webp' : meta.extension;
    const width = chooseWidth(meta.variants, options.preferredWidth);
    if (!width) {
      return options.format === 'webp' && meta.webp ? toWebpPath(normalized) : normalized;
    }
    return withVariant(normalized, width, format);
  };

  const buildSrcset = (src = '', options = {}) => {
    const normalized = normalizeSrc(src);
    const meta = getMeta(normalized);
    if (!meta || !Array.isArray(meta.variants) || !meta.variants.length) return '';
    const format = options.format === 'webp' ? '.webp' : meta.extension;
    return meta.variants.map((width) => `${withVariant(normalized, width, format)} ${width}w`).join(', ');
  };

  const buildAttributeString = (attributes = {}) => Object.entries(attributes)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false)
    .map(([key, value]) => value === true ? key : `${key}="${escapeHtml(value)}"`)
    .join(' ');

  const renderResponsiveImage = (options = {}) => {
    const src = normalizeSrc(options.src || '');
    if (!src) return '';

    const meta = getMeta(src);
    const width = options.width || meta?.width || '';
    const height = options.height || meta?.height || '';
    const imgAttributes = {
      src: getPrimarySrc(src, { preferredWidth: options.preferredWidth }),
      alt: options.alt || '',
      class: options.className || '',
      loading: options.loading || 'lazy',
      decoding: options.decoding || 'async',
      width,
      height,
      sizes: options.sizes || '',
      srcset: buildSrcset(src, { preferredWidth: options.preferredWidth }),
      fetchpriority: options.fetchPriority || '',
    };
    const imgTag = `<img ${buildAttributeString(imgAttributes)} />`;
    if (!meta?.webp) return imgTag;

    const webpSrc = getPrimarySrc(src, { preferredWidth: options.preferredWidth, format: 'webp' });
    const webpSrcset = buildSrcset(src, { preferredWidth: options.preferredWidth, format: 'webp' });
    const sourceAttributes = {
      type: 'image/webp',
      srcset: webpSrcset || webpSrc,
      sizes: options.sizes || '',
    };
    return `<picture><source ${buildAttributeString(sourceAttributes)} />${imgTag}</picture>`;
  };

  window.siteImages = {
    manifest,
    normalizeSrc,
    getMeta,
    getDimensions,
    getPrimarySrc,
    buildSrcset,
    renderResponsiveImage,
  };
})();"""


@dataclass
class SourceConfig:
    path: Path
    widths: list[int]


def resampling_filter() -> int:
    return getattr(Image, "Resampling", Image).LANCZOS


def webp_supported() -> bool:
    return bool(features.check("webp"))


def is_source_image(path: Path) -> bool:
    if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        return False
    if path.suffix.lower() == ".webp":
        return False
    return VARIANT_RE.search(path.name) is None


def collect_sources() -> list[SourceConfig]:
    seen: dict[Path, list[int]] = {}
    for group in MANAGED_GROUPS:
        for pattern in group["patterns"]:
            for path in ROOT.glob(pattern):
                if not path.is_file() or not is_source_image(path):
                    continue
                widths = list(group["widths"])
                existing = seen.get(path, [])
                seen[path] = sorted(set(existing + widths))
    return [SourceConfig(path=path, widths=widths) for path, widths in sorted(seen.items())]


def get_dimensions(path: Path) -> tuple[int, int]:
    with Image.open(path) as image:
        normalized = ImageOps.exif_transpose(image)
        width, height = normalized.size
    if not width or not height:
        raise RuntimeError(f"Could not determine dimensions for {path}")
    return width, height


def variant_path(path: Path, width: int, suffix: str | None = None) -> Path:
    extension = suffix or path.suffix
    return path.with_name(f"{path.stem}-{width}{extension}")


def webp_path(path: Path) -> Path:
    return path.with_suffix(".webp")


def resize_dimensions(width: int, height: int, target_width: int) -> tuple[int, int]:
    target_height = max(1, round(height * (target_width / width)))
    return target_width, target_height


def save_image(image: Image.Image, target: Path, source_suffix: str) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    suffix = target.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        output = image.convert("RGB")
        output.save(target, format="JPEG", quality=88, optimize=True, progressive=True)
        return
    if suffix == ".png":
        output = image
        if output.mode == "P":
            output = output.convert("RGBA")
        output.save(target, format="PNG", optimize=True)
        return
    if suffix == ".webp":
        output = image
        if output.mode == "P":
            output = output.convert("RGBA")
        output.save(target, format="WEBP", quality=82, method=6)
        return
    raise RuntimeError(f"Unsupported output format for {target} from {source_suffix}")


def build_resized_variant(path: Path, width: int) -> Path:
    target = variant_path(path, width)
    if target.exists():
        return target
    with Image.open(path) as image:
        normalized = ImageOps.exif_transpose(image)
        resized = normalized.resize(
            resize_dimensions(*normalized.size, width),
            resample=resampling_filter(),
        )
        save_image(resized, target, path.suffix.lower())
    return target


def build_webp(path: Path) -> Path:
    target = webp_path(path)
    if target.exists():
        return target
    with Image.open(path) as image:
        normalized = ImageOps.exif_transpose(image)
        save_image(normalized, target, path.suffix.lower())
    return target


def write_site_images(manifest: dict[str, dict[str, object]]) -> None:
    payload = json.dumps(manifest, indent=2, sort_keys=True)
    SITE_IMAGES_JS.write_text(
        HELPER_JS.replace("__MANIFEST__", payload) + "\n",
        encoding="utf-8",
    )


def optimize_original_thumbnail(path: Path) -> None:
    if path.name not in {"rdifp.png", "uofm.png"}:
        return
    width, _ = get_dimensions(path)
    if width <= 512:
        return
    temp_path = path.with_name(f"{path.stem}.tmp{path.suffix}")
    with Image.open(path) as image:
        normalized = ImageOps.exif_transpose(image)
        resized = normalized.resize(
            resize_dimensions(*normalized.size, 512),
            resample=resampling_filter(),
        )
        save_image(resized, temp_path, path.suffix.lower())
    temp_path.replace(path)


def main() -> int:
    sources = collect_sources()
    manifest: dict[str, dict[str, object]] = {}
    allow_webp = webp_supported()

    for source in sources:
        optimize_original_thumbnail(source.path)

    for source in sources:
        width, height = get_dimensions(source.path)
        available_variants = []
        for target_width in sorted(set(source.widths)):
            if target_width >= width:
                continue
            variant = build_resized_variant(source.path, target_width)
            if allow_webp:
                build_webp(variant)
            available_variants.append(target_width)

        if allow_webp:
            build_webp(source.path)

        relative = source.path.relative_to(ROOT).as_posix()
        manifest[relative] = {
            "width": width,
            "height": height,
            "extension": source.path.suffix.lower(),
            "variants": available_variants,
            "webp": allow_webp,
        }

    write_site_images(manifest)
    print(f"Updated {SITE_IMAGES_JS.relative_to(ROOT)} with {len(manifest)} managed images.")
    if not allow_webp:
        print("WebP support was not available in Pillow. Raster variants were generated without WebP companions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
