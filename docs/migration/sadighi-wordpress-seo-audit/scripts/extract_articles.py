#!/usr/bin/env python3
"""
Phase-1 implementation: extract + clean real WordPress content for the 25
approved articles (23 from p0-launch-list.csv + the 2 now-unblocked
collision posts) into a structured JSON intermediate, which
generate_knowledge_articles_ts.py then turns into the real
src/content/knowledge-articles.ts file.

Kept in docs/migration/.../scripts/ (planning-audit territory) — its OUTPUT
is what gets written into the Next.js app, not this script itself.
"""
import csv
import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

AUDIT_DIR = Path(__file__).resolve().parent.parent
WP_FILES = [AUDIT_DIR / "WordPress.2026-08-22.xml", AUDIT_DIR / "WordPress.2026-08-22 (1).xml"]
P0_CSV = AUDIT_DIR / "phase-1-plan" / "p0-launch-list.csv"
INV_CSV = AUDIT_DIR / "wordpress-content-inventory.csv"
OUT_JSON = AUDIT_DIR / "scripts" / "extracted-articles.json"

NS = {"wp": "http://wordpress.org/export/1.2/", "content": "http://purl.org/rss/1.0/modules/content/"}

SERVICE_FOR_TOPIC = {
    "orthognathic-surgery": "orthognathic-surgery",
    "advanced-dental-implant": "advanced-dental-implant",
    "impacted-tooth-surgery": "impacted-tooth-surgery",
    "rhinoplasty": "rhinoplasty",
    "facial-cosmetic-surgery": "facial-cosmetic-surgery",
    "blepharoplasty": "facial-cosmetic-surgery",
}

# post_id -> (approved topic_cluster, proposed slug, extra legacy URLs)
TARGETS = {
    "13920": {"topic": "advanced-dental-implant"},
    "14141": {"topic": "orthognathic-surgery"},
    "8564": {"topic": "rhinoplasty"},
    "14138": {"topic": "impacted-tooth-surgery"},
    "13531": {"topic": "orthognathic-surgery"},
    "14033": {"topic": "orthognathic-surgery"},
    "8594": {"topic": "facial-cosmetic-surgery"},
    "8713": {"topic": "advanced-dental-implant", "structured_data_type": "Article"},
    "14134": {"topic": "advanced-dental-implant"},
    "13739": {"topic": "orthognathic-surgery"},
    "8415": {"topic": "impacted-tooth-surgery"},
    "13924": {"topic": "facial-cosmetic-surgery", "extra_legacy": ["https://dralirezasadighi.com/لیفت-شقیقه-گلایدینگ؛-جوانسازی-طبیعی-ب/"]},
    "14781": {"topic": "rhinoplasty"},
    "8584": {"topic": "facial-cosmetic-surgery"},
    "14126": {"topic": "impacted-tooth-surgery"},
    "8409": {"topic": "orthognathic-surgery"},
    "14557": {"topic": "orthognathic-surgery"},
    "7226": {"topic": "facial-cosmetic-surgery"},
    "13976": {"topic": "orthognathic-surgery", "extra_legacy": ["https://dralirezasadighi.com/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود/"]},
    "13949": {"topic": "orthognathic-surgery"},
    "14594": {"topic": "advanced-dental-implant"},
    "8558": {"topic": "advanced-dental-implant"},
    "8392": {"topic": "rhinoplasty"},
    "7212": {"topic": "blepharoplasty", "canonical_of": "بلفاروپلاستی collision — post_id 7168 retired"},
    "8597": {"topic": "care-instructions", "note": "fat-injection FAQ collision — Persian only, English post_id 13413 excluded from phase 1"},
}

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"[ \t]+")
FAQ_HEADING_RE = re.compile(r"^\s*\d+\s*[-–.]\s*(.+?)\s*[؟?]\s*$")


def strip_inline_tags(fragment: str) -> str:
    """Strip inline markup (strong/a/em/span/svg icons) down to plain text."""
    fragment = re.sub(r"<svg\b.*?</svg>", "", fragment, flags=re.DOTALL | re.IGNORECASE)
    fragment = re.sub(r"<img\b[^>]*/?>", "", fragment, flags=re.IGNORECASE)
    fragment = TAG_RE.sub("", fragment)
    fragment = html.unescape(fragment)
    fragment = WS_RE.sub(" ", fragment).strip()
    return fragment


BLOCK_TAG_RE = re.compile(r"<(h1|h2|h3|h4|p|li)\b[^>]*>(.*?)</\1>", re.DOTALL | re.IGNORECASE)
BOUNDARY_RE = re.compile(r"</?(?:ul|ol|br)\b[^>]*>|\n{2,}", re.IGNORECASE)


def clean_html_to_blocks(raw_html: str):
    """Turn raw WordPress content:encoded HTML into an ordered list of
    ('h1'|'h2'|'h3'|'h4'|'p'|'li', text) blocks — a general-purpose,
    single-pass cleaner that handles three patterns seen in this export:
    classic <p>-wrapped posts, Elementor-leaked markup (style blocks,
    section wrappers, decorative icon images), and posts where body text
    after a heading is left as bare, unwrapped text (common in the FAQ-style
    posts and several long-form guides alike) — the gap between one matched
    tag and the next is captured as an implicit paragraph rather than
    silently dropped, so mixed documents (wrapped AND bare text in the same
    post) are handled in one pass instead of two disjoint modes.
    """
    text = raw_html
    text = re.sub(r"<style\b.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<script\b.*?</script>", "", text, flags=re.DOTALL | re.IGNORECASE)
    # unwrap (not strip-content) Elementor section/div wrappers — keep what's inside
    text = re.sub(r"</?section\b[^>]*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"</?div\b[^>]*>", "", text, flags=re.IGNORECASE)

    blocks = []
    pos = 0
    for m in BLOCK_TAG_RE.finditer(text):
        gap = text[pos:m.start()]
        for segment in BOUNDARY_RE.split(gap):
            cleaned = strip_inline_tags(segment)
            if cleaned and len(cleaned) > 3:
                blocks.append(("p", cleaned))
        tag = m.group(1).lower()
        inner = strip_inline_tags(m.group(2))
        if inner:
            blocks.append((tag, inner))
        pos = m.end()

    trailing = text[pos:]
    for segment in BOUNDARY_RE.split(trailing):
        cleaned = strip_inline_tags(segment)
        if cleaned and len(cleaned) > 3:
            blocks.append(("p", cleaned))

    return blocks


def build_sections_and_faq(blocks):
    """Split cleaned blocks into (contentSections, faq). If >=60% of h2/h3
    headings (excluding the H1 title) match the "N - question?" pattern,
    treat the article as FAQ-structured: everything before the first
    matching heading becomes a short intro contentSection, the rest becomes
    faq pairs. Otherwise, every heading starts a new contentSection."""
    body = [b for b in blocks if b[0] != "h1"]
    headings = [b for b in body if b[0] in ("h2", "h3", "h4")]
    faq_matches = sum(1 for tag, text in headings if FAQ_HEADING_RE.match(text))
    is_faq = len(headings) >= 3 and faq_matches / max(len(headings), 1) >= 0.6

    if is_faq:
        intro_paras = []
        faq = []
        current_q = None
        current_answer = []
        for tag, text in body:
            if tag in ("h2", "h3", "h4"):
                m = FAQ_HEADING_RE.match(text)
                if current_q is not None:
                    faq.append({"question": current_q, "answer": " ".join(current_answer).strip()})
                    current_answer = []
                current_q = m.group(1) + "؟" if m else text
            elif tag in ("p", "li"):
                if current_q is None:
                    intro_paras.append(text)
                else:
                    current_answer.append(text)
        if current_q is not None:
            faq.append({"question": current_q, "answer": " ".join(current_answer).strip()})
        sections = [{"heading": None, "paragraphs": intro_paras}] if intro_paras else []
        return sections, faq

    sections = []
    current = {"heading": None, "paragraphs": []}
    for tag, text in body:
        if tag in ("h2", "h3", "h4"):
            if current["paragraphs"] or current["heading"]:
                sections.append(current)
            current = {"heading": text, "paragraphs": []}
        elif tag in ("p", "li"):
            current["paragraphs"].append(text)
    if current["paragraphs"] or current["heading"]:
        sections.append(current)

    # Drop a trailing heading-only section — this export's only recurring
    # case is a dead "فهرست مطالب" (table of contents) widget label with no
    # generated links captured; a heading-only section anywhere else in the
    # middle is a legitimate group header (its sub-headings carry the real
    # content right after it) and is kept.
    if sections and sections[-1]["heading"] and not sections[-1]["paragraphs"]:
        sections = sections[:-1]

    return sections, []


def word_count_reading_time(sections, faq):
    words = 0
    for s in sections:
        words += sum(len(p.split()) for p in s["paragraphs"])
    for f in faq:
        words += len(f["question"].split()) + len(f["answer"].split())
    minutes = max(1, round(words / 180))
    return f"{minutes} دقیقه مطالعه"


def main():
    p0_rows = {r["current_url"].rstrip("/"): r for r in csv.DictReader(open(P0_CSV, encoding="utf-8-sig"))}
    inv_by_id = {r["post_id"]: r for r in csv.DictReader(open(INV_CSV, encoding="utf-8-sig"))}

    items_by_id = {}
    for fname in WP_FILES:
        tree = ET.parse(fname)
        for item in tree.getroot().find("channel").findall("item"):
            pid = item.findtext("wp:post_id", default="", namespaces=NS)
            if pid in TARGETS:
                items_by_id[pid] = item

    results = []
    for post_id, cfg in TARGETS.items():
        item = items_by_id.get(post_id)
        if item is None:
            print(f"MISSING WXR ITEM for post_id {post_id}")
            continue
        inv = inv_by_id.get(post_id, {})
        raw_content = item.findtext("content:encoded", default="", namespaces=NS) or ""
        blocks = clean_html_to_blocks(raw_content)
        sections, faq = build_sections_and_faq(blocks)

        link = html.unescape(item.findtext("link", default="", namespaces=NS) or "")
        from urllib.parse import unquote
        if "%" in link:
            try:
                link = unquote(link, encoding="utf-8", errors="strict")
            except UnicodeDecodeError:
                pass
        slug = urlparse(link).path.strip("/").split("/")[-1]

        title = html.unescape(item.findtext("title", default="", namespaces=NS) or "")
        post_date = item.findtext("wp:post_date", default="", namespaces=NS)
        post_modified = item.findtext("wp:post_modified", default="", namespaces=NS)

        first_para = ""
        for s in sections:
            if s["paragraphs"]:
                first_para = s["paragraphs"][0]
                break
        if not first_para and faq:
            first_para = faq[0]["answer"]
        excerpt = (first_para[:180] + "…") if len(first_para) > 180 else first_para

        rank_math_title = html.unescape(inv.get("rank_math_title", "") or "")
        rank_math_description = html.unescape(inv.get("rank_math_description", "") or "")
        seo_title = rank_math_title.strip() or title
        seo_description = rank_math_description.strip() or excerpt

        legacy_urls = [link]
        legacy_urls.extend(cfg.get("extra_legacy", []))

        topic = cfg["topic"]
        results.append({
            "postId": post_id,
            "slug": slug,
            "title": title,
            "seoTitle": seo_title,
            "seoDescription": seo_description,
            "excerpt": excerpt,
            "topicCluster": topic,
            "serviceRelation": SERVICE_FOR_TOPIC.get(topic),
            "publishedAt": post_date.split(" ")[0] if post_date else None,
            "updatedAt": post_modified.split(" ")[0] if post_modified else None,
            "readingTime": word_count_reading_time(sections, faq),
            "contentSections": sections,
            "faq": faq,
            "legacyUrls": legacy_urls,
            "structuredDataType": cfg.get("structured_data_type", "MedicalWebPage"),
            "hasThumbnail": bool(inv.get("thumbnail_id", "").strip()),
            "note": cfg.get("note", ""),
        })

    OUT_JSON.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(results)} articles -> {OUT_JSON}")
    for r in results:
        print(f"  {r['postId']:>6}  sections={len(r['contentSections']):>2}  faq={len(r['faq']):>2}  {r['slug'][:50]}")


if __name__ == "__main__":
    main()
