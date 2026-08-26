#!/usr/bin/env python3
"""Batch 2 (2026-08-26): extracts the 2 genuine English WordPress posts that
are real counterparts of a Batch 2 Persian primary article (not translated
by hand — the clinic already published separate English originals for
these two topics) and writes them into scripts/translations/<fa-slug>.json,
the exact shape generate_knowledge_articles_ts.py already reads for every
other article's translations. Reuses extract_articles.py's own HTML
cleaning/FAQ-detection functions so this content goes through the identical
mechanical pipeline as every other migrated article — nothing here is
authored or rewritten."""
import html
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse, unquote

from extract_articles import (
    NS, WP_FILES, clean_html_to_blocks, build_sections_and_faq,
)

AUDIT_DIR = Path(__file__).resolve().parent.parent
TRANSLATIONS_DIR = Path(__file__).resolve().parent / "translations"

# english_post_id -> the Batch 2 Persian primary slug this is a translation of
EN_TRANSLATIONS = {
    "13713": "ناقرینگیهای-ناشی-از-تروما-به-صورت-عل",  # Facial Asymmetry Due to Trauma
    "13961": "فک-پایین-عقبرفته",  # Recessed Lower Jaw / Retrognathia
}


def main():
    items_by_id = {}
    for fname in WP_FILES:
        tree = ET.parse(fname)
        for item in tree.getroot().find("channel").findall("item"):
            pid = item.findtext("wp:post_id", default="", namespaces=NS)
            if pid in EN_TRANSLATIONS:
                items_by_id[pid] = item

    for post_id, fa_slug in EN_TRANSLATIONS.items():
        item = items_by_id.get(post_id)
        if item is None:
            print(f"MISSING WXR ITEM for post_id {post_id}")
            continue

        raw_content = item.findtext("content:encoded", default="", namespaces=NS) or ""
        blocks = clean_html_to_blocks(raw_content)
        sections, faq = build_sections_and_faq(blocks)

        link = html.unescape(item.findtext("link", default="", namespaces=NS) or "")
        if "%" in link:
            try:
                link = unquote(link, encoding="utf-8", errors="strict")
            except UnicodeDecodeError:
                pass
        en_slug = urlparse(link).path.strip("/").split("/")[-1]

        title = html.unescape(item.findtext("title", default="", namespaces=NS) or "")

        first_para = ""
        for s in sections:
            if s["paragraphs"]:
                first_para = s["paragraphs"][0]
                break
        if not first_para and faq:
            first_para = faq[0]["answer"]
        excerpt = (first_para[:180] + "…") if len(first_para) > 180 else first_para

        translation = {
            "slug": en_slug,
            "title": title,
            "seoTitle": title,
            "seoDescription": excerpt,
            "excerpt": excerpt,
            "contentSections": sections,
            "faq": faq,
        }

        out_path = TRANSLATIONS_DIR / f"{fa_slug}.json"
        out_path.write_text(json.dumps({"en": translation}, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Wrote {out_path.name} <- post_id {post_id} ({en_slug}), sections={len(sections)} faq={len(faq)}")


if __name__ == "__main__":
    main()
