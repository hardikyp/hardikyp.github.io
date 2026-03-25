#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from html import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://hardikpatil.com"
IMAGE_MANIFEST_PATH = ROOT / "assets/js/site-images.js"


@dataclass(frozen=True)
class ShellParts:
    header: str
    back_to_top: str
    footer: str


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def normalize_src(src: str) -> str:
    value = (src or "").strip().replace("\\", "/")
    if not value:
        return ""
    return value.lstrip("./").lstrip("/")


def pretty_route(section: str, slug: str) -> str:
    return f"{section}/{slug}/"


def extract_sync_block(text: str, name: str) -> str:
    pattern = re.compile(
        rf"<!-- partial-sync:{re.escape(name)}:start -->.*?<!-- partial-sync:{re.escape(name)}:end -->",
        re.DOTALL,
    )
    match = pattern.search(text)
    if not match:
        raise RuntimeError(f"Could not find partial-sync block {name!r}")
    return match.group(0)


def load_shell_parts(template_path: Path) -> ShellParts:
    text = read_text(template_path)
    return ShellParts(
        header=extract_sync_block(text, "header"),
        back_to_top=extract_sync_block(text, "back-to-top"),
        footer=extract_sync_block(text, "footer"),
    )


def parse_image_manifest() -> dict[str, dict]:
    text = read_text(IMAGE_MANIFEST_PATH)
    marker = "const manifest = "
    start = text.find(marker)
    if start == -1:
        return {}
    cursor = start + len(marker)
    if cursor >= len(text) or text[cursor] != "{":
        return {}
    depth = 0
    end = None
    for index in range(cursor, len(text)):
        char = text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = index + 1
                break
    if end is None:
        return {}
    return json.loads(text[cursor:end])


IMAGE_MANIFEST = parse_image_manifest()


def choose_width(variants: list[int], preferred_width: int | None) -> int | None:
    if not variants:
        return None
    preferred = preferred_width or variants[0]
    for width in variants:
        if width >= preferred:
            return width
    return variants[-1]


def with_variant(src: str, width: int, extension: str | None = None) -> str:
    normalized = normalize_src(src)
    stem, ext = normalized.rsplit(".", 1)
    chosen_ext = (extension or f".{ext}").lstrip(".")
    return f"{stem}-{width}.{chosen_ext}"


def with_webp(src: str, width: int | None = None) -> str:
    normalized = normalize_src(src)
    stem, _ = normalized.rsplit(".", 1)
    if width is not None:
        return f"{stem}-{width}.webp"
    return f"{stem}.webp"


def render_image(
    src: str,
    alt: str,
    *,
    sizes: str = "",
    preferred_width: int | None = None,
    loading: str = "lazy",
    decoding: str = "async",
    fetch_priority: str | None = None,
    class_name: str | None = None,
) -> str:
    normalized = normalize_src(src)
    if not normalized:
        return ""
    if re.match(r"^https?://", normalized, re.IGNORECASE):
        attrs = [
            f'src="{escape(src)}"',
            f'alt="{escape(alt)}"',
            f'loading="{loading}"',
            f'decoding="{decoding}"',
        ]
        if class_name:
            attrs.append(f'class="{escape(class_name)}"')
        if fetch_priority:
            attrs.append(f'fetchpriority="{fetch_priority}"')
        return f"<img {' '.join(attrs)} />"

    meta = IMAGE_MANIFEST.get(normalized)
    if not meta:
        attrs = [
            f'src="{escape(normalized)}"',
            f'alt="{escape(alt)}"',
            f'loading="{loading}"',
            f'decoding="{decoding}"',
        ]
        if class_name:
            attrs.append(f'class="{escape(class_name)}"')
        if fetch_priority:
            attrs.append(f'fetchpriority="{fetch_priority}"')
        return f"<img {' '.join(attrs)} />"

    variant_width = choose_width(meta.get("variants", []), preferred_width)
    img_src = with_variant(normalized, variant_width, meta["extension"]) if variant_width else normalized
    jpg_srcset = ", ".join(
        f"{with_variant(normalized, width, meta['extension'])} {width}w"
        for width in meta.get("variants", [])
    )
    webp_srcset = ", ".join(
        f"{with_webp(normalized, width)} {width}w"
        for width in meta.get("variants", [])
    )

    attrs = [
        f'src="{escape(img_src)}"',
        f'alt="{escape(alt)}"',
        f'loading="{loading}"',
        f'decoding="{decoding}"',
        f'width="{meta["width"]}"',
        f'height="{meta["height"]}"',
    ]
    if class_name:
        attrs.append(f'class="{escape(class_name)}"')
    if sizes:
        attrs.append(f'sizes="{escape(sizes)}"')
    if jpg_srcset:
        attrs.append(f'srcset="{escape(jpg_srcset)}"')
    if fetch_priority:
        attrs.append(f'fetchpriority="{fetch_priority}"')
    img = f"<img {' '.join(attrs)} />"

    if not meta.get("webp"):
        return img

    source_attrs = [f'type="image/webp"']
    if webp_srcset:
        source_attrs.append(f'srcset="{escape(webp_srcset)}"')
    else:
        source_attrs.append(f'srcset="{escape(with_webp(normalized))}"')
    if sizes:
        source_attrs.append(f'sizes="{escape(sizes)}"')
    return f"<picture><source {' '.join(source_attrs)} />{img}</picture>"


def sanitize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def first_paragraph_text(html: str) -> str:
    if not html:
        return ""
    match = re.search(r"<p[^>]*>(.*?)</p>", html, re.DOTALL | re.IGNORECASE)
    source = match.group(1) if match else html
    text = re.sub(r"<[^>]+>", " ", source)
    return sanitize_whitespace(text)


def trim_text(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    shortened = text[:limit]
    shortened = re.sub(r"\s+\S*$", "", shortened)
    return f"{shortened}…"


def detail_excerpt(item: dict, limit: int = 220) -> str:
    derived = first_paragraph_text(item.get("detail") or item.get("body") or "")
    if derived:
        return trim_text(derived, limit)
    return sanitize_whitespace(item.get("excerpt") or "")


def detail_summary(html: str, limit: int = 180) -> str:
    text = first_paragraph_text(html)
    return trim_text(text, limit) if text else ""


def format_display_date(iso_date: str) -> str:
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", iso_date or ""):
        return ""
    year, month, day = iso_date.split("-")
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return f"{month_names[int(month) - 1]} {int(day)}, {year}"


def sort_date_value(pub: dict) -> int:
    date_str = str(pub.get("date") or "")
    if re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        return int(date_str.replace("-", ""))
    year = str(pub.get("year") or "0")
    if year.isdigit():
        return int(f"{year}0101")
    return 0


def update_href(item: dict) -> str:
    return item.get("url") or pretty_route("updates", item["slug"])


def project_href(item: dict) -> str:
    return pretty_route("projects", item["slug"])


def teaching_href(item: dict) -> str:
    return pretty_route("teaching", item["slug"])


def render_update_card(item: dict, home: bool = False) -> str:
    url = update_href(item)
    title = escape(item.get("title") or "Update")
    tag = escape(item.get("tag") or "")
    date = item.get("date") or ""
    formatted_date = format_display_date(date)
    excerpt = escape(detail_excerpt(item))
    image = render_image(
        item.get("image", {}).get("src", "assets/img/updates/placeholder.svg"),
        item.get("image", {}).get("alt", ""),
        sizes="64px",
        preferred_width=128,
    )
    if home:
        return f"""
          <article class="update-card">
            <a class="update-card__link" href="{escape(url)}">
              <div class="update-card__header">
                <div class="update-card__logo">
                  {image}
                </div>
                <div class="update-card__heading">
                  <h3 class="update-card__title">{title}</h3>
                  <div class="update-card__meta">
                    {'<span class="update-tag">' + tag + '</span>' if tag else ''}
                    {'<time datetime="' + escape(date) + '">' + escape(formatted_date) + '</time>' if formatted_date else ''}
                  </div>
                </div>
              </div>
              <div class="update-card__body">
                {'<p class="update-card__excerpt">' + excerpt + '</p>' if excerpt else ''}
                <span class="btn tertiary">Read more</span>
              </div>
            </a>
          </article>
        """.strip()
    return f"""
      <article class="update-card" data-url="{escape(url)}" role="link" tabindex="0">
        <div class="update-card__header">
          <a class="update-card__logo" href="{escape(url)}">
            {image}
          </a>
          <div class="update-card__heading">
            <h3 class="update-card__title"><a href="{escape(url)}">{title}</a></h3>
            <div class="update-card__meta">
              {'<span class="update-tag">' + tag + '</span>' if tag else ''}
              {'<time datetime="' + escape(date) + '">' + escape(formatted_date) + '</time>' if formatted_date else ''}
            </div>
          </div>
        </div>
        <div class="update-card__body">
          {'<p class="update-card__excerpt">' + excerpt + '</p>' if excerpt else ''}
          <a class="btn tertiary" href="{escape(url)}">Read more</a>
        </div>
      </article>
    """.strip()


def render_expertise_section(data: dict) -> str:
    enabled = data.get("enabled", True) is not False
    items = data.get("items", []) if enabled else []
    hidden_attr = ' hidden aria-hidden="true"' if not enabled else ""
    if enabled and items:
        cards = "\n".join(
            f"""<article class="expertise-card">
        <h3>{escape(item.get("title") or "Focus Area")}</h3>
        {'<p>' + escape(item.get("summary") or "") + '</p>' if item.get("summary") else ''}
      </article>"""
            for item in items
        )
    else:
        cards = '<p class="expertise__fallback">Focus areas coming soon.</p>'
    return f"""
      <section class="expertise" aria-labelledby="homeExpertiseHeading"{hidden_attr}>
        <div class="expertise__intro">
          <h2 id="homeExpertiseHeading">Scientific expertise</h2>
          <p>A quick snapshot of my expertise beyond deployable and reconfigurable systems.</p>
        </div>
        <div class="expertise__grid" aria-live="polite" data-prerendered="true">
          {cards}
        </div>
      </section>
    """.strip()


def render_testimonial_slide(item: dict, index: int, total: int) -> str:
    name = item.get("name", "")
    photo = item.get("photo", "")
    photo_markup = (
        render_image(photo, f"Portrait of {name}", class_name="testimonial-card__photo", sizes="64px", preferred_width=128)
        if photo
        else f'<div class="testimonial-card__photo testimonial-card__photo--placeholder" aria-hidden="true">{escape("".join(part[:1] for part in name.split()[:2]).upper())}</div>'
    )
    return f"""
      <div class="testimonials-carousel__slide" role="listitem" aria-label="Testimonial {index + 1} of {total}">
        <article class="testimonial-card">
          <div class="testimonial-card__profile">
            {photo_markup}
            <div>
              <p class="testimonial-card__name">{escape(name)}</p>
              <p class="testimonial-card__meta">
                <span class="testimonial-card__title">{escape(item.get("title", ""))}</span>
                <span class="testimonial-card__affiliation">{escape(item.get("affiliation", ""))}</span>
              </p>
            </div>
          </div>
          <blockquote>
            <p>{escape(item.get("quote", ""))}</p>
          </blockquote>
        </article>
      </div>
    """.strip()


def render_testimonials_section(data: dict) -> str:
    enabled = data.get("enabled", True) is not False
    items = data.get("items", []) if enabled else []
    if not enabled or not items:
        return """
      <section class="testimonials" aria-labelledby="testimonialsHeading" hidden aria-hidden="true">
        <div class="testimonials__intro">
          <h2 id="testimonialsHeading">What collaborators are saying</h2>
          <p>Short reflections from the people I've worked with</p>
        </div>
        <div class="testimonials-carousel" data-testimonials-carousel data-prerendered="true"></div>
        <div class="testimonials-controls" role="group" aria-label="Testimonials navigation" hidden>
          <button class="testimonials-nav testimonials-nav--prev" type="button" aria-label="Previous testimonial" data-testimonials-nav="prev">
            <span aria-hidden="true"><span class="symbol-text">←</span></span>
          </button>
          <button class="testimonials-nav testimonials-nav--next" type="button" aria-label="Next testimonial" data-testimonials-nav="next">
            <span aria-hidden="true"><span class="symbol-text">→</span></span>
          </button>
        </div>
      </section>
    """.strip()
    slides = "\n".join(render_testimonial_slide(item, index, len(items)) for index, item in enumerate(items))
    return f"""
      <section class="testimonials" aria-labelledby="testimonialsHeading">
        <div class="testimonials__intro">
          <h2 id="testimonialsHeading">What collaborators are saying</h2>
          <p>Short reflections from the people I've worked with</p>
        </div>
        <div class="testimonials-carousel" data-testimonials-carousel data-prerendered="true">
          <div class="testimonials-carousel__viewport" tabindex="0">
            <div class="testimonials-carousel__track" role="list">
              {slides}
            </div>
          </div>
          <div class="sr-only" aria-live="polite" data-testimonials-status></div>
        </div>
        <div class="testimonials-controls" role="group" aria-label="Testimonials navigation" hidden>
          <button class="testimonials-nav testimonials-nav--prev" type="button" aria-label="Previous testimonial" data-testimonials-nav="prev">
            <span aria-hidden="true"><span class="symbol-text">←</span></span>
          </button>
          <button class="testimonials-nav testimonials-nav--next" type="button" aria-label="Next testimonial" data-testimonials-nav="next">
            <span aria-hidden="true"><span class="symbol-text">→</span></span>
          </button>
        </div>
      </section>
    """.strip()


def render_project_card(item: dict) -> str:
    year_text = escape((item.get("years") or "").strip())
    type_label = escape(item.get("type") or "")
    meta = ""
    if type_label or year_text:
        meta = f"""
          <div class="project-card__meta">
            {'<span class="project-card__pill">' + type_label + '</span>' if type_label else ''}
            {'<span class="project-card__year">' + year_text + '</span>' if year_text else ''}
          </div>
        """.strip()
    image = ""
    card_image = item.get("card", {}).get("image")
    if card_image:
        image = f"""
          <div class="project-card__media">
            {render_image(card_image, item.get("card", {}).get("alt", ""), sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 92vw", preferred_width=800)}
          </div>
        """.strip()
    return f"""
      <a class="project-card" href="{escape(project_href(item))}" data-type="{type_label}">
        {image}
        <div class="project-card__body">
          <h3 class="project-card__title">{escape(item.get("title") or "Project")}</h3>
          {meta}
          {'<p class="project-card__summary">' + escape(item.get("summary") or "") + '</p>' if item.get("summary") else ''}
          <span class="btn tertiary project-card__link">Read more</span>
        </div>
      </a>
    """.strip()


def render_teaching_card(item: dict) -> str:
    title = " - ".join(part for part in [item.get("courseNumber"), item.get("courseTitle")] if part)
    image_markup = '<div class="teaching-card__placeholder">Course image placeholder</div>'
    card_image = item.get("card", {}).get("image") or ""
    if card_image:
        image_markup = render_image(card_image, item.get("card", {}).get("alt", ""), sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 92vw", preferred_width=800)
    university = escape(item.get("university") or "")
    year = escape(item.get("year") or "")
    return f"""
      <a class="project-card teaching-card" href="{escape(teaching_href(item))}" data-university="{university}">
        <div class="project-card__media teaching-card__media{' has-image' if card_image else ''}">
          {image_markup}
        </div>
        <div class="project-card__body teaching-card__body">
          <h3 class="project-card__title teaching-card__title">{escape(title or 'Course')}</h3>
          <p class="teaching-card__meta-line">
            {'<span class="project-card__pill teaching-card__pill">' + university + '</span>' if university else ''}
            {'<span class="teaching-card__sep" aria-hidden="true">•</span>' if university and year else ''}
            {'<span class="project-card__year teaching-card__year">' + year + '</span>' if year else ''}
          </p>
          {'<p class="project-card__summary teaching-card__summary">' + escape(item.get("card", {}).get("summary") or "") + '</p>' if item.get("card", {}).get("summary") else ''}
        </div>
      </a>
    """.strip()


def render_publication_item(pub: dict) -> str:
    category = normalize_pub_type(pub.get("type"))
    year = escape(str(pub.get("year") or ""))
    authors = escape(", ".join(pub.get("authors") or []))
    title = escape(pub.get("title") or "")
    status = pub.get("status")
    status_text = f"({escape(status.replace('-', ' '))}, {year})" if status else f"({year})"
    venue_line = "".join(
        str(part)
        for part in [
            pub.get("venue") or "",
            f" {pub['volume']}" if pub.get("volume") else "",
            f", {pub['pages']}" if pub.get("pages") else "",
        ]
        if part
    )
    actions = []
    labels = {"doi": "DOI", "pdf": "PDF", "preprint": "Preprint", "slides": "Slides", "video": "Video", "code": "Code", "event": "Event", "site": "Site"}
    for key in ["doi", "pdf", "preprint", "slides", "video", "code", "event", "site"]:
        href = (pub.get("links") or {}).get(key)
        if href:
            actions.append((href, labels[key]))
    action_markup = []
    for index, (href, label) in enumerate(actions):
        tier = "primary" if index == 0 else "secondary" if index == 1 else "tertiary"
        action_markup.append(f'<a class="btn {tier}" href="{escape(href)}">{escape(label)}</a>')
    abstract = pub.get("abstract") or ""
    keywords = pub.get("keywords") or []
    return f"""
      <article class="pub-item" data-cat="{escape(category)}">
        <div class="pub-head">
          <div>
            <div class="pub-title">{authors}. {status_text} {title}.</div>
            <div class="pub-meta"><span class="tag">{escape(label_for_pub_type(category))}</span><span class="muted">{escape(venue_line)}</span></div>
          </div>
          <button class="pub-toggle" aria-expanded="false" aria-label="Toggle details"></button>
        </div>
        <div class="pub-body" hidden>
          {'<div class="pub-abstract"><p><b>Abstract:</b> ' + escape(abstract) + '</p>' + ('<p class="pub-keys"><b>Keywords:</b> ' + escape('; '.join(keywords)) + '</p>' if keywords else '') + '</div>' if abstract else ''}
          <div class="pub-actions">{''.join(action_markup)}</div>
        </div>
      </article>
    """.strip()


def normalize_pub_type(value: str | None) -> str:
    return (value or "other").lower()


def label_for_pub_type(value: str | None) -> str:
    return normalize_pub_type(value).replace("-", " ").title()


def sorted_projects() -> list[dict]:
    sources = [
        ("Research", ROOT / "projects/data/research.json"),
        ("Course", ROOT / "projects/data/courses.json"),
        ("Internship", ROOT / "projects/data/internships.json"),
        ("Other", ROOT / "projects/data/others.json"),
    ]
    items: list[dict] = []
    for type_name, path in sources:
        data = load_json(path)
        for item in data.get("projects", []):
            items.append({**item, "type": item.get("type") or type_name})
    items.sort(key=lambda item: max([int(y) for y in re.findall(r"\d{4}", str(item.get("years") or ""))] or [0]), reverse=True)
    return items


def sorted_updates() -> list[dict]:
    items = load_json(ROOT / "updates/data/updates.json").get("updates", [])
    return sorted(items, key=lambda item: item.get("date") or "", reverse=True)


def sorted_publications() -> list[dict]:
    pubs: list[dict] = []
    sources = [
        ("journal", ROOT / "publications/data/journals.json"),
        ("conference", ROOT / "publications/data/conferences.json"),
        ("talk", ROOT / "publications/data/talks.json"),
    ]
    for fallback_type, path in sources:
        data = load_json(path)
        for pub in data.get("publications", []):
            pubs.append({**pub, "type": pub.get("type") or fallback_type})
    pubs.sort(key=sort_date_value, reverse=True)
    return pubs


def teaching_data() -> dict:
    return load_json(ROOT / "teaching/data/teaching.json")


def replace_once(text: str, pattern: str, replacement: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(f"Expected to replace one block for pattern {pattern!r}")
    return updated


def prerender_home() -> None:
    path = ROOT / "index.html"
    text = read_text(path)
    latest_updates = "\n".join(render_update_card(item, home=True) for item in sorted_updates()[:3])
    home_updates_section = f"""
      <section class="updates-preview">
        <div class="updates-preview__heading">
          <h2>Latest Updates</h2>
        </div>
        <div class="update-list" data-prerendered="true">
          {latest_updates}
        </div>
        <div class="updates-preview__more">
          <a class="updates-preview__link" href="/updates/index.html">View all updates</a>
        </div>
      </section>
    """.strip()
    text = replace_once(text, r'<section class="updates-preview">.*?</section>', home_updates_section)
    text = replace_once(text, r'<section class="expertise"[^>]*>.*?</section>', render_expertise_section(load_json(ROOT / "assets/data/expertise.json")))
    text = replace_once(text, r'<section class="testimonials"[^>]*>.*?</section>', render_testimonials_section(load_json(ROOT / "assets/data/testimonials.json")))
    write_text(path, text)


def prerender_projects_index(projects: list[dict]) -> None:
    path = ROOT / "projects/index.html"
    cards = "\n".join(render_project_card(item) for item in projects)
    main = f"""
    <main id="main" tabindex="-1" class="pubs projects-page">
      <section class="updates-hero contained">
        <p class="eyebrow">Portfolio</p>
        <h1>Projects</h1>
        <p class="muted">Research, course projects, internships, and more.</p>
      </section>

      <div class="pub-filters contained" id="projTypeFilters" aria-label="Filter by type"></div>
      <section class="projects-grid contained" aria-label="Projects">
        <div id="projectsGrid" class="cards" data-prerendered="true">
          {cards}
        </div>
      </section>
    </main>
    """.strip()
    write_text(path, replace_once(read_text(path), r"<main id=\"main\"[\s\S]*?</main>", main))


def prerender_updates_index(updates: list[dict]) -> None:
    path = ROOT / "updates/index.html"
    cards = "\n".join(render_update_card(item) for item in updates)
    main = f"""
    <main id="main" tabindex="-1" class="pubs updates-page">
      <section class="updates-hero contained">
        <p class="eyebrow">Latest</p>
        <h1>Updates</h1>
        <p class="muted">Announcements, milestones, awards, publications and more.</p>
      </section>
      <section class="updates-feed contained" aria-label="Latest updates">
        <div class="update-list" data-prerendered="true">
          {cards}
        </div>
      </section>
    </main>
    """.strip()
    write_text(path, replace_once(read_text(path), r"<main id=\"main\"[\s\S]*?</main>", main))


def prerender_publications_index(publications: list[dict]) -> None:
    path = ROOT / "publications/index.html"
    by_year: dict[str, list[dict]] = {}
    for pub in publications:
        by_year.setdefault(str(pub.get("year") or ""), []).append(pub)
    sections = []
    for year in sorted(by_year.keys(), reverse=True):
        items = "\n".join(render_publication_item(pub) for pub in sorted(by_year[year], key=sort_date_value, reverse=True))
        sections.append(f"""
          <section>
            <h2 class="pub-year">{escape(year)}</h2>
            <div class="pub-list">
              {items}
            </div>
          </section>
        """.strip())
    main = f"""
    <main id="main" tabindex="-1" class="pubs">
      <section class="updates-hero contained">
        <p class="eyebrow">Scholarly</p>
        <h1>Publications</h1>
        <p class="muted">Journal papers, conference papers, posters and talks.</p>
      </section>

      <div class="pub-filters contained" id="pubFilters" aria-label="Filter publications"></div>

      <div id="pubApp" class="contained" data-prerendered="true">
        {' '.join(sections)}
      </div>
    </main>
    """.strip()
    write_text(path, replace_once(read_text(path), r"<main id=\"main\"[\s\S]*?</main>", main))


def prerender_teaching_index(data: dict) -> None:
    path = ROOT / "teaching/index.html"
    hero = data.get("hero") or {}
    philosophy = data.get("philosophy") or {}
    experiences = [item for item in data.get("experiences", []) if item.get("slug")]
    philosophy_image = (philosophy.get("image") or {}).get("src", "").strip()
    if philosophy_image:
        media = render_image(philosophy_image, (philosophy.get("image") or {}).get("alt", "Teaching presentation photo"), sizes="(min-width: 1024px) 32vw, 92vw", preferred_width=800)
        media_markup = f"""
        <div class="teaching-philosophy__media has-image" id="philosophyMedia">
          {media.replace("<img ", '<img id="philosophyImage" ', 1) if "<img " in media else media.replace("<picture>", '<picture id="philosophyImagePicture">', 1)}
          <div id="philosophyPlaceholder" class="teaching-philosophy__placeholder" hidden>Presentation photo placeholder</div>
        </div>
        """.strip()
    else:
        media_markup = """
        <div class="teaching-philosophy__media" id="philosophyMedia">
          <img id="philosophyImage" alt="Presentation photo placeholder" loading="lazy" hidden />
          <div id="philosophyPlaceholder" class="teaching-philosophy__placeholder">Presentation photo placeholder</div>
        </div>
        """.strip()
    chips = "\n".join(f'<span class="teaching-philosophy__chip">{escape(item)}</span>' for item in philosophy.get("principles", []))
    cards = "\n".join(render_teaching_card(item) for item in experiences) or '<p class="teaching-empty">Teaching entries will be added soon.</p>'
    main = f"""
    <main id="main" tabindex="-1" class="pubs teaching-page">
      <section class="teaching-hero contained">
        <p class="eyebrow">Academics</p>
        <h1 id="teachingTitle">{escape(hero.get("title") or "Teaching")}</h1>
        <p id="teachingSubtitle" class="muted">{escape(hero.get("subtitle") or "")}</p>
      </section>

      <section class="teaching-philosophy contained" aria-label="Teaching philosophy">
        {media_markup}
        <div class="teaching-philosophy__content">
          <h2 id="philosophyTitle">{escape(philosophy.get("title") or "Teaching Philosophy")}</h2>
          <p id="philosophyHeadline" class="teaching-philosophy__headline">{escape(philosophy.get("headline") or philosophy.get("body") or "")}</p>
          <div id="philosophyPrinciples" class="teaching-philosophy__principles" aria-label="Teaching principles">{chips}</div>
          <p id="philosophyOutcome" class="teaching-philosophy__outcome">{escape(philosophy.get("outcomeLine") or "")}</p>
        </div>
      </section>

      <section class="teaching-experience contained" aria-label="Teaching experience">
        <h2>Courses Taught</h2>
        <div id="teachingFilters" class="pub-filters" aria-label="Filter courses by university"></div>
        <div id="teachingCards" class="teaching-cards" data-prerendered="true">{cards}</div>
      </section>
    </main>
    """.strip()
    write_text(path, replace_once(read_text(path), r"<main id=\"main\"[\s\S]*?</main>", main))


def detail_structured_data(kind: str, item: dict, canonical_url: str, description: str, image_url: str) -> dict:
    if kind == "update":
        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": item.get("title") or "Update",
            "description": description,
            "datePublished": item.get("date") or None,
            "dateModified": item.get("date") or None,
            "author": {"@type": "Person", "name": "Hardik Patil"},
            "image": image_url,
            "isPartOf": {"@type": "WebSite", "name": "Hardik Patil", "url": f"{SITE_URL}/"},
            "mainEntityOfPage": canonical_url,
        }
    if kind == "project":
        return {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": item.get("title") or "Project",
            "description": description,
            "author": {"@type": "Person", "name": "Hardik Patil"},
            "dateCreated": item.get("years") or None,
            "image": image_url,
            "isPartOf": {"@type": "WebSite", "name": "Hardik Patil", "url": f"{SITE_URL}/"},
            "mainEntityOfPage": canonical_url,
        }
    return {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": f"{item.get('courseNumber') or ''}: {item.get('courseTitle') or 'Course'}".replace(": ", ": ").strip(": "),
        "description": description,
        "provider": {"@type": "CollegeOrUniversity", "name": item.get("university") or "University of Michigan"},
        "isPartOf": {"@type": "WebSite", "name": "Hardik Patil", "url": f"{SITE_URL}/"},
        "mainEntityOfPage": canonical_url,
    }


def render_update_body(item: dict) -> str:
    body_html = item.get("detail") or item.get("body") or '<p class="muted">Additional details will be posted soon.</p>'
    gallery_markup = ""
    gallery = item.get("gallery") or []
    if gallery:
        items = []
        for entry in gallery:
            if isinstance(entry, str):
                image_markup = render_image(entry, "", sizes="(min-width: 1024px) 720px, 92vw", preferred_width=1200)
                items.append(f'<figure class="update-gallery__item" role="listitem">{image_markup}</figure>')
            elif entry.get("src"):
                image_markup = render_image(entry["src"], entry.get("alt", ""), sizes="(min-width: 1024px) 720px, 92vw", preferred_width=1200)
                caption = entry.get("caption", "")
                items.append(f'<figure class="update-gallery__item" role="listitem">{image_markup}{"<figcaption class=\"update-gallery__caption\">" + escape(caption) + "</figcaption>" if caption else ""}</figure>')
        if items:
            gallery_markup = f'<div class="update-gallery" role="list">{"".join(items)}</div>'
    return f"{gallery_markup}{body_html}"


def render_project_media(item: dict) -> str:
    images = (item.get("detail") or {}).get("images") or []
    chosen = [entry for entry in images if entry and entry.get("src")][:2]
    if not chosen:
        return ""
    figures = []
    sizes = "(min-width: 1024px) 42vw, 92vw" if len(chosen) > 1 else "(min-width: 1024px) 720px, 92vw"
    for index, entry in enumerate(chosen, start=1):
        caption = entry.get("caption") or entry.get("alt") or f"Project illustration {index}"
        figures.append(
            f"""<figure class="project-media__item">
        {render_image(entry["src"], entry.get("alt", ""), loading="eager" if index == 1 else "lazy", sizes=sizes, preferred_width=1200, fetch_priority="high" if index == 1 else None)}
        <figcaption><strong>Fig. {index}.</strong> {escape(caption)}</figcaption>
      </figure>"""
        )
    multi_class = " project-media--multi" if len(chosen) > 1 else ""
    return f'<div class="update-detail__media{multi_class}" id="projMedia">{"".join(figures)}</div>'


def render_teaching_media(item: dict) -> str:
    image = item.get("card", {}).get("image") or ""
    if not image:
        return '<div class="update-detail__media" id="teachMedia" style="display:none"></div>'
    return f'<div class="update-detail__media" id="teachMedia">{render_image(image, item.get("card", {}).get("alt") or item.get("courseTitle") or "Course", sizes="(min-width: 1024px) 720px, 92vw", preferred_width=1200)}</div>'


def render_detail_page(kind: str, item: dict, shell: ShellParts) -> str:
    if kind == "update":
        title = item.get("title") or "Update"
        description = item.get("meta") or detail_summary(item.get("detail") or item.get("body") or "") or "Updates and announcements from Hardik Patil."
        canonical_path = pretty_route("updates", item["slug"])
        image_path = normalize_src(item.get("image", {}).get("src") or "assets/img/portrait-1200.jpg")
        image_alt = item.get("image", {}).get("alt") or title
        main = f"""
    <main id="main" tabindex="-1" class="update-page">
      <section class="updates-hero contained">
        <p class="eyebrow">Latest</p>
        <h1>Updates</h1>
        <p class="muted">Announcements, milestones, awards, publications and more.</p>
      </section>
      <section class="hero hero--update contained">
        <h2 id="viewTitle">{escape(title)}</h2>
        <div class="update-detail__meta">
          {'<span class="update-tag" id="viewTag">' + escape(item.get("tag") or "") + '</span>' if item.get("tag") else '<span class="update-tag" id="viewTag" style="display:none"></span>'}
          {'<time id="viewDate" datetime="' + escape(item.get("date") or "") + '">' + escape(format_display_date(item.get("date") or "")) + '</time>' if item.get("date") else '<time id="viewDate" style="display:none"></time>'}
        </div>
      </section>
      <article class="update-detail contained" id="viewArticle">
        <div id="viewBody">{render_update_body(item)}</div>
        <a class="btn tertiary" href="updates/index.html">Back to updates</a>
      </article>
    </main>
    """.strip()
        body_class = "page-update"
    elif kind == "project":
        title = item.get("title") or "Project"
        description = item.get("summary") or detail_summary((item.get("detail") or {}).get("body") or "") or "Project details from Hardik Patil."
        canonical_path = pretty_route("projects", item["slug"])
        first_image = ((item.get("detail") or {}).get("images") or [{}])[0].get("src") or item.get("card", {}).get("image") or "assets/img/portrait-1200.jpg"
        image_path = normalize_src(first_image)
        image_alt = ((item.get("detail") or {}).get("images") or [{}])[0].get("alt") or item.get("card", {}).get("alt") or title
        content_html = (item.get("detail") or {}).get("body") or (f"<p>{escape(item.get('summary') or '')}</p>" if item.get("summary") else '<p class="muted">This project does not have additional details yet.</p>')
        main = f"""
    <main id="main" tabindex="-1" class="update-page project-view">
      <section class="updates-hero contained">
        <p class="eyebrow">Portfolio</p>
        <h1>Projects</h1>
        <p class="muted">Detailed project highlights, methods, and outcomes.</p>
      </section>
      <section class="hero hero--update project-detail-hero contained">
        <h2 id="projTitle">{escape(title)}</h2>
        <div class="project-hero__meta" id="projMeta"{' style="display:none"' if not item.get("type") and not item.get("years") else ''}>
          {'<span class="project-card__pill project-hero__pill" id="projType">' + escape(item.get("type") or "") + '</span>' if item.get("type") else '<span class="project-card__pill project-hero__pill" id="projType" style="display:none"></span>'}
          {'<span class="project-hero__year" id="projYear">' + escape(item.get("years") or "") + '</span>' if item.get("years") else '<span class="project-hero__year" id="projYear" style="display:none"></span>'}
        </div>
      </section>
      <article class="update-detail contained project-detail" id="projArticle">
        {render_project_media(item) or '<div class="update-detail__media" id="projMedia" style="display:none"></div>'}
        <div id="projContent">{content_html}</div>
        <div class="project-detail__actions">
          <a class="btn tertiary" href="projects/index.html">Back to projects</a>
        </div>
      </article>
    </main>
    """.strip()
        body_class = "page-update project-view"
    else:
        title = f"{item.get('courseNumber') or ''}: {item.get('courseTitle') or 'Course'}".replace(":", ": ", 1).replace("  ", " ").strip().strip(":")
        description = item.get("card", {}).get("summary") or detail_summary((item.get("detail") or {}).get("body") or "") or "Teaching details from Hardik Patil."
        canonical_path = pretty_route("teaching", item["slug"])
        image_path = normalize_src(item.get("card", {}).get("image") or "assets/img/portrait-1200.jpg")
        image_alt = item.get("card", {}).get("alt") or title
        main = f"""
    <main id="main" tabindex="-1" class="update-page teaching-view">
      <section class="updates-hero contained">
        <p class="eyebrow">Academics</p>
        <h1>Teaching</h1>
        <p class="muted">Course details, responsibilities, and instructional outcomes.</p>
      </section>
      <section class="hero hero--update project-detail-hero contained">
        <h2 id="teachTitle">{escape(title)}</h2>
        <div class="project-hero__meta" id="teachMeta"{' style="display:none"' if not item.get("university") and not item.get("year") else ''}>
          {'<span class="project-card__pill project-hero__pill" id="teachMetaPill">' + escape(item.get("university") or "") + '</span>' if item.get("university") else '<span class="project-card__pill project-hero__pill" id="teachMetaPill" style="display:none"></span>'}
          {'<span class="project-hero__year" id="teachMetaYear">' + escape(item.get("year") or "") + '</span>' if item.get("year") else '<span class="project-hero__year" id="teachMetaYear" style="display:none"></span>'}
        </div>
      </section>
      <article class="update-detail contained teaching-detail" id="teachArticle">
        {render_teaching_media(item)}
        <div id="teachBody">{(item.get("detail") or {}).get("body") or '<p class="muted">Additional details will be posted soon.</p>'}</div>
        <div class="project-detail__actions">
          <a class="btn tertiary" href="teaching/index.html">Back to teaching</a>
        </div>
      </article>
    </main>
    """.strip()
        body_class = "page-update teaching-view"

    canonical_url = f"{SITE_URL}/{canonical_path}"
    image_url = f"{SITE_URL}/{image_path}"
    structured_data = json.dumps(detail_structured_data(kind, item, canonical_url, description, image_url), separators=(",", ":"))
    heading = "Update" if kind == "update" else "Projects" if kind == "project" else "Teaching"
    page_title = f"{title} — {heading} — Hardik Patil"
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="../../" />
    <title>{escape(page_title)}</title>
    <meta name="description" content="{escape(description)}" />
    <meta name="author" content="Hardik Patil" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="{escape(canonical_url)}" />
    <link rel="preload" href="/assets/css/base.css" as="style" />
    <link rel="preload" href="/assets/css/style.css" as="style" />
    <link rel="stylesheet" href="/assets/css/base.css" />
    <link rel="stylesheet" href="/assets/css/style.css" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="{escape(page_title)}" />
    <meta property="og:description" content="{escape(description)}" />
    <meta property="og:url" content="{escape(canonical_url)}" />
    <meta property="og:image" content="{escape(image_url)}" />
    <meta property="og:image:alt" content="{escape(image_alt)}" />
    <meta property="og:site_name" content="Hardik Patil" />
    <meta property="og:locale" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{escape(page_title)}" />
    <meta name="twitter:description" content="{escape(description)}" />
    <meta name="twitter:image" content="{escape(image_url)}" />
    <meta name="twitter:image:alt" content="{escape(image_alt)}" />
    <script type="application/ld+json">{structured_data}</script>
  </head>
  <body class="{body_class}">
    <a class="skip-link" href="#main">Skip to content</a>
    {shell.header}
    {main}
    {shell.back_to_top}
    {shell.footer}
    <script src="/assets/js/includes.js" defer></script>
    <script src="/assets/js/site-images.js" defer></script>
    <script src="/assets/js/main.js" defer></script>
  </body>
</html>
"""


def prerender_detail_pages() -> None:
    update_shell = load_shell_parts(ROOT / "updates/view.html")
    project_shell = load_shell_parts(ROOT / "projects/view.html")
    teaching_shell = load_shell_parts(ROOT / "teaching/view.html")

    for item in sorted_updates():
        slug = item.get("slug")
        if not slug:
            continue
        write_text(ROOT / "updates" / slug / "index.html", render_detail_page("update", item, update_shell))

    for item in sorted_projects():
        slug = item.get("slug")
        if not slug:
            continue
        write_text(ROOT / "projects" / slug / "index.html", render_detail_page("project", item, project_shell))

    for item in teaching_data().get("experiences", []):
        slug = item.get("slug")
        if not slug:
            continue
        write_text(ROOT / "teaching" / slug / "index.html", render_detail_page("teaching", item, teaching_shell))


def main() -> int:
    projects = sorted_projects()
    updates = sorted_updates()
    publications = sorted_publications()
    teaching = teaching_data()

    prerender_home()
    prerender_projects_index(projects)
    prerender_updates_index(updates)
    prerender_publications_index(publications)
    prerender_teaching_index(teaching)
    prerender_detail_pages()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
