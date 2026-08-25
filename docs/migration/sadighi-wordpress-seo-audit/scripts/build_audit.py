#!/usr/bin/env python3
"""
WordPress -> Next.js Knowledge Center SEO migration audit.

Planning-only script: reads the two WordPress WXR exports and the Search
Console XLSX, and writes three CSVs + a summary markdown into the parent
`sadighi-wordpress-seo-audit/` folder. Does not touch the Next.js app.

Run: python3 scripts/build_audit.py   (from the audit folder, or anywhere —
paths below are relative to this file's parent directory)
"""
import csv
import html
import re
import xml.etree.ElementTree as ET
from collections import Counter, OrderedDict
from pathlib import Path
from urllib.parse import urlparse, unquote

import openpyxl

BASE = Path(__file__).resolve().parent.parent
WP_FILES = [BASE / "WordPress.2026-08-22.xml", BASE / "WordPress.2026-08-22 (1).xml"]
XLSX_FILE = BASE / "dralirezasadighi.com-Performance-on-Search-2026-08-23.xlsx"

OUT_INVENTORY = BASE / "wordpress-content-inventory.csv"
OUT_GSC = BASE / "search-console-url-performance.csv"
OUT_MAP = BASE / "migration-map-draft.csv"
OUT_SUMMARY = BASE / "migration-summary.md"

NS = {
    "wp": "http://wordpress.org/export/1.2/",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "excerpt": "http://wordpress.org/export/1.2/excerpt/",
    "dc": "http://purl.org/dc/elements/1.1/",
}

# ---------------------------------------------------------------------------
# Real Next.js route taxonomy (read from src/content/services.ts,
# src/content/care-instructions.ts, src/middleware.ts as of 2026-08-23).
# fa is the default locale but IS visible in canonical URLs (middleware
# redirects bare paths to /fa/...), so every legacy WP URL needs an explicit
# redirect rule regardless of destination.
# ---------------------------------------------------------------------------
SERVICE_URL = {
    "orthognathic-surgery": "/fa/services/orthognathic-surgery",
    "advanced-dental-implant": "/fa/services/advanced-dental-implant",
    "impacted-tooth-surgery": "/fa/services/impacted-tooth-surgery",
    "rhinoplasty": "/fa/services/rhinoplasty",
    "facial-cosmetic-surgery": "/fa/services/facial-cosmetic-surgery",
    "blepharoplasty": "/fa/services/facial-cosmetic-surgery",  # no dedicated service page today
    "facial-trauma-surgery": "/fa/services/facial-trauma-surgery",
}
CORE_TOPICS = set(SERVICE_URL) | {"care-instructions"}

CARE_URL_DEFAULT = "/fa/care-instructions"
CARE_SUBMAP = [
    (["ایمپلنت"], "implant-care"),
    (["بینی"], "rhinoplasty-care"),
    (["پلک", "بلفارو"], "blepharoplasty-care"),
    (["دندان عقل", "نهفته"], "wisdom-tooth-care"),
    (["ابرو", "لیفت صورت"], "facelift-browlift-care"),
    (["سینوس"], "sinus-lift-care"),
    (["چانه", "ژنیوپلاستی"], "genioplasty-care"),
    (["فک"], "jaw-surgery-care"),
]

# Topic classification keyword lists, checked in order (most specific first).
TOPIC_KEYWORDS = [
    ("impacted-tooth-surgery", ["دندان عقل", "دندان نهفته", "کشیدن دندان عقل"]),
    ("advanced-dental-implant", ["ایمپلنت"]),
    ("orthognathic-surgery", ["جراحی فک", "ارتوگناتیک", "برجستگی فک", "عقب رفتگی فک", "جراحی فک و چانه"]),
    ("rhinoplasty", ["جراحی بینی", "رینوپلاستی", "بینی"]),
    ("blepharoplasty", ["بلفاروپلاستی", "پلک"]),
    ("facial-trauma-surgery", ["تروما", "شکستگی فک", "شکستگی صورت", "شکستگی بینی", "تصادف"]),
    ("facial-cosmetic-surgery", [
        "زیبایی صورت", "لیفت صورت", "لیفت شقیقه", "جوانسازی صورت", "جوان‌سازی صورت",
        "پروتز گونه", "افزایش حجم گونه", "بوتاکس", "ژل", "فیلر", "لیفت ابرو",
        "پروتز چانه", "اصلاح چانه", "کانتور صورت", "غبغب",
    ]),
    ("care-instructions", ["مراقبت بعد از", "مراقبت‌های بعد از", "مراقبت پس از", "دوره نقاهت", "مراقبت"]),
    ("doctor-profile", ["بیوگرافی", "رزومه", "درباره دکتر", "درباره ما", "سوابق دکتر"]),
    ("clinic-info", ["کلینیک", "مطب", "ساعت کاری", "نوبت دهی", "تماس با ما", "شماره تماس", "آدرس مطب"]),
    ("general-dental", ["دندانپزشکی", "کامپوزیت", "روکش دندان", "لمینت", "ارتودنسی", "جرمگیری", "دندان"]),
]

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")
PHP_STR_RE = re.compile(r's:\d+:"((?:[^"\\]|\\.)*)"')


def strip_tags_len(raw_html: str) -> str:
    text = html.unescape(raw_html or "")
    text = TAG_RE.sub(" ", text)
    text = WS_RE.sub(" ", text).strip()
    return text


def decode_php_serialized_strings(raw: str) -> str:
    if not raw:
        return ""
    return ",".join(PHP_STR_RE.findall(raw))


def last_path_segment(url: str) -> str:
    path = urlparse(url).path.strip("/")
    if not path:
        return ""
    return path.rsplit("/", 1)[-1]


def is_ugly_slug(url: str) -> bool:
    seg = last_path_segment(url)
    if not seg:
        return False
    if re.fullmatch(r"elementor-\d+", seg):
        return True
    if re.fullmatch(r"\d+", seg):
        return True
    if re.fullmatch(r"p\d+", seg):
        return True
    return False


def normalize_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return ""
    if url.endswith("/") and len(url) > len("https://x/"):
        url = url.rstrip("/")
    return url.lower() if False else url  # Persian has no case; keep as-is, just strip slash


def classify_topic(match_text: str) -> str:
    for topic, keywords in TOPIC_KEYWORDS:
        for kw in keywords:
            if kw in match_text:
                return topic
    return "uncategorized"


def care_sub_slug(match_text: str):
    for keywords, slug in CARE_SUBMAP:
        for kw in keywords:
            if kw in match_text:
                return slug
    return None


# ---------------------------------------------------------------------------
# 1. Parse WordPress XML exports
# ---------------------------------------------------------------------------
def parse_wp_files():
    records = []
    for path in WP_FILES:
        tree = ET.parse(path)
        channel = tree.getroot().find("channel")
        for item in channel.findall("item"):
            post_type = item.findtext("wp:post_type", default="", namespaces=NS)
            if post_type not in ("post", "page"):
                continue  # skip attachments and any other export item types

            status = item.findtext("wp:status", default="", namespaces=NS)
            post_id = item.findtext("wp:post_id", default="", namespaces=NS)
            title_raw = item.findtext("title", default="") or ""
            title = html.unescape(title_raw)
            # WXR percent-encodes non-ASCII permalinks/slugs (UTF-8 %XX); Search
            # Console exports the same URLs already decoded. Decode here so both
            # sides match and so Persian text is readable in the inventory —
            # lossless for well-formed UTF-8 percent-encoding, a no-op otherwise.
            link_raw = (item.findtext("link", default="") or "").strip()
            slug_raw = item.findtext("wp:post_name", default="", namespaces=NS)
            try:
                link = unquote(link_raw, encoding="utf-8", errors="strict") if "%" in link_raw else link_raw
            except UnicodeDecodeError:
                link = link_raw
            try:
                slug = unquote(slug_raw, encoding="utf-8", errors="strict") if "%" in slug_raw else slug_raw
            except UnicodeDecodeError:
                slug = slug_raw
            post_date = item.findtext("wp:post_date", default="", namespaces=NS)
            modified_date = item.findtext("wp:post_modified", default="", namespaces=NS)

            content_encoded = item.findtext("content:encoded", default="", namespaces=NS) or ""
            visible_text = strip_tags_len(content_encoded)
            content_length = len(visible_text)
            has_content = content_length >= 30

            categories, tags = [], []
            for cat in item.findall("category"):
                domain = cat.get("domain", "")
                text = (cat.text or "").strip()
                if not text:
                    continue
                if domain == "category":
                    categories.append(text)
                elif domain == "post_tag":
                    tags.append(text)

            postmeta = OrderedDict()
            for pm in item.findall("wp:postmeta", NS):
                key = pm.findtext("wp:meta_key", default="", namespaces=NS)
                value = pm.findtext("wp:meta_value", default="", namespaces=NS) or ""
                postmeta.setdefault(key, value)

            elementor_data = postmeta.get("_elementor_data", "")
            has_elementor_content = len(elementor_data.strip()) > 50

            aparat_haystack = (content_encoded + " " + elementor_data).lower()
            has_aparat = "aparat" in aparat_haystack

            thumbnail_id = postmeta.get("_thumbnail_id", "")
            rank_math_title = html.unescape(postmeta.get("rank_math_title", ""))
            rank_math_description = html.unescape(postmeta.get("rank_math_description", ""))
            rank_math_robots = decode_php_serialized_strings(postmeta.get("rank_math_robots", ""))
            rank_math_focus_keyword = html.unescape(postmeta.get("rank_math_focus_keyword", ""))

            comments_count = len(item.findall("wp:comment", NS))

            records.append({
                "type": post_type,
                "status": status,
                "post_id": post_id,
                "title": title,
                "current_url": link,
                "slug": slug,
                "post_date": post_date,
                "modified_date": modified_date,
                "content_length": content_length,
                "has_content": has_content,
                "has_elementor_content": has_elementor_content,
                "has_aparat": has_aparat,
                "thumbnail_id": thumbnail_id,
                "categories": "|".join(categories),
                "tags": "|".join(tags),
                "rank_math_title": rank_math_title,
                "rank_math_description": rank_math_description,
                "rank_math_robots": rank_math_robots,
                "rank_math_focus_keyword": rank_math_focus_keyword,
                "comments_count": comments_count,
            })
    return records


# ---------------------------------------------------------------------------
# 2. Parse Search Console XLSX (Pages sheet)
# ---------------------------------------------------------------------------
def parse_gsc():
    wb = openpyxl.load_workbook(XLSX_FILE, data_only=True)
    ws = wb["Pages"]
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        url, clicks, impressions, ctr, position = row[:5]
        if not url:
            continue
        rows.append({
            "url": url,
            "clicks": int(clicks) if clicks is not None else 0,
            "impressions": int(impressions) if impressions is not None else 0,
            "ctr": round(float(ctr), 4) if ctr is not None else 0.0,
            "position": round(float(position), 2) if position is not None else 0.0,
        })
    return rows


# ---------------------------------------------------------------------------
# 3. Build inventory + join + classify + decide
# ---------------------------------------------------------------------------
def build():
    wp_records = parse_wp_files()
    gsc_rows = parse_gsc()
    gsc_by_url = {normalize_url(r["url"]): r for r in gsc_rows}

    # Real WordPress data-integrity issue found in this export: distinct
    # post_ids that resolve to the identical live permalink (two published
    # posts "claiming" the same URL). Can't be auto-resolved — flag both.
    url_post_ids = {}
    for rec in wp_records:
        url_post_ids.setdefault(normalize_url(rec["current_url"]), []).append(rec["post_id"])
    duplicate_urls = {u: ids for u, ids in url_post_ids.items() if len(ids) > 1}

    matched_urls = set()
    map_rows = []

    for rec in wp_records:
        norm = normalize_url(rec["current_url"])
        gsc = gsc_by_url.get(norm)
        if gsc:
            matched_urls.add(norm)
            clicks, impressions, ctr, position = gsc["clicks"], gsc["impressions"], gsc["ctr"], gsc["position"]
        else:
            clicks = impressions = 0
            ctr = position = 0.0

        slug_words = last_path_segment(rec["current_url"]).replace("-", " ")
        match_text = " ".join([
            rec["title"], rec["categories"].replace("|", " "), rec["tags"].replace("|", " "), slug_words,
        ])
        topic = classify_topic(match_text)
        ugly = is_ugly_slug(rec["current_url"])
        has_signal = clicks > 0 or impressions > 0

        # --- priority ---
        if rec["status"] == "draft" and not has_signal:
            priority = "P3"
        elif not rec["has_content"] and not rec["has_elementor_content"] and not rec["has_aparat"] and not has_signal:
            priority = "P3"
        elif clicks >= 20 or impressions >= 300 or (topic in CORE_TOPICS and rec["has_content"]):
            priority = "P0"
        elif has_signal or topic in CORE_TOPICS:
            priority = "P1"
        else:
            priority = "P2"

        # --- recommended action / proposed URL / redirect / notes ---
        action, proposed, redirect_required, note = decide(rec, topic, priority, ugly, clicks, impressions, match_text)

        if norm in duplicate_urls:
            other_ids = [pid for pid in duplicate_urls[norm] if pid != rec["post_id"]]
            action = "needs-manual-review"
            note = (f"DATA ISSUE: {len(duplicate_urls[norm])} WordPress posts (post_ids "
                    f"{', '.join(duplicate_urls[norm])}) share this exact live URL — WordPress can only serve "
                    f"one of them. Resolve which post is canonical before deciding a migration target. " + note)

        map_rows.append({
            "current_url": rec["current_url"],
            "type": rec["type"],
            "status": rec["status"],
            "title": rec["title"],
            "clicks": clicks,
            "impressions": impressions,
            "ctr": ctr,
            "position": position,
            "topic_cluster": topic,
            "priority": priority,
            "recommended_action": action,
            "proposed_next_url": proposed,
            "redirect_required": "yes" if redirect_required else "no",
            "notes": note,
        })

    unmatched_gsc = [r for r in gsc_rows if normalize_url(r["url"]) not in {normalize_url(m["current_url"]) for m in map_rows}]

    return wp_records, gsc_rows, map_rows, unmatched_gsc, duplicate_urls


def decide(rec, topic, priority, ugly, clicks, impressions, match_text):
    has_signal = clicks > 0 or impressions > 0

    if priority == "P3":
        if has_signal:
            return ("needs-manual-review", "", True,
                    "Flagged as empty/draft but has Search Console clicks or impressions — "
                    "do not auto-discard; recover content or pick a redirect target manually.")
        return ("do-not-migrate", "", False,
                "No content, no Elementor data, no Aparat embed, and zero Search Console signal — safe to leave out.")

    if topic == "doctor-profile":
        return ("redirect-to-home-or-about", "/fa/about", True,
                "About/biography-style content — consolidate into the new About page.")

    if topic == "clinic-info":
        return ("redirect-to-home-or-about", "/fa/contact", True,
                "Clinic/contact-info content — consolidate into Contact or About; confirm which manually.")

    if topic == "care-instructions":
        sub = care_sub_slug(match_text)
        if sub:
            return ("redirect-to-knowledge-article", f"/fa/care-instructions/{sub}", True,
                    f"Old care post overlaps the existing care-instructions/{sub} page; redirect instead of duplicating.")
        return ("needs-manual-review", CARE_URL_DEFAULT, True,
                "Care-instruction content without a clear match to an existing care topic — review before mapping.")

    if topic in SERVICE_URL:
        target = SERVICE_URL[topic]
        if priority == "P0":
            if rec["content_length"] > 500:
                slug_seg = last_path_segment(rec["current_url"])
                proposed = "" if ugly else f"/fa/knowledge/{slug_seg}"
                note = (f"Substantial standalone article on core topic ({topic}); migrate into Knowledge Center "
                        f"as its own article and redirect old URL to it; cross-link from {target}.")
                if ugly:
                    note += " Old slug is auto-generated (not SEO-friendly) — assign a descriptive Persian slug manually."
                return ("migrate-to-knowledge-center", proposed, True, note)
            return ("redirect-to-service-page", target, True,
                    f"High-value but short/duplicative content — fold into {target} rather than a thin standalone page.")
        if priority == "P1":
            return ("merge-into-service-page", target, has_signal,
                    f"Supporting content for {topic} — merge into {target}; redirect only because this URL carries some traffic." if has_signal
                    else f"Supporting content for {topic} — merge into {target}; no redirect needed, URL has no recorded traffic.")
        return ("merge-into-topic-hub", target, False,
                f"Low-value supporting content for {topic}; fold into {target}, no dedicated redirect required.")

    if topic == "general-dental":
        if has_signal or priority == "P1":
            return ("migrate-to-knowledge-center", "", True,
                    "General dental content with some traffic — migrate as a standalone Knowledge Center article.")
        return ("needs-manual-review", "", False,
                "General dental content, low/no signal — confirm relevance before migrating.")

    # uncategorized
    if has_signal:
        return ("needs-manual-review", "", True,
                "Traffic present but topic unclear from title/categories/slug — classify manually before deciding redirect target.")
    if rec["has_content"]:
        return ("needs-manual-review", "", False, "Content exists but topic is unclear — classify manually.")
    return ("do-not-migrate", "", False, "No clear topic, no content signal, no traffic.")


# ---------------------------------------------------------------------------
# 4. Write CSVs
# ---------------------------------------------------------------------------
def write_csv(path, fieldnames, rows):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_summary(wp_records, gsc_rows, map_rows, unmatched_gsc, duplicate_urls):
    posts = [r for r in wp_records if r["type"] == "post"]
    pages = [r for r in wp_records if r["type"] == "page"]
    published_posts = [r for r in posts if r["status"] == "publish"]
    published_pages = [r for r in pages if r["status"] == "publish"]

    matched = [m for m in map_rows if m["clicks"] > 0 or m["impressions"] > 0]
    unmatched_wp = [m for m in map_rows if m["clicks"] == 0 and m["impressions"] == 0]

    prio_counts = Counter(m["priority"] for m in map_rows)

    top_clicks = sorted(map_rows, key=lambda m: m["clicks"], reverse=True)[:30]
    top_impr = sorted(map_rows, key=lambda m: m["impressions"], reverse=True)[:30]

    phase1 = [m for m in map_rows if m["priority"] == "P0"]
    phase1_sorted = sorted(phase1, key=lambda m: (m["clicks"], m["impressions"]), reverse=True)

    def table(rows, cols):
        lines = ["| " + " | ".join(cols) + " |", "|" + "|".join(["---"] * len(cols)) + "|"]
        for r in rows:
            lines.append("| " + " | ".join(str(r.get(c, "")).replace("|", "/") for c in cols) + " |")
        return "\n".join(lines)

    lines = []
    lines.append("# Dr. Sadighi WordPress → Knowledge Center — Migration Audit Summary")
    lines.append("")
    lines.append(f"Generated from `{WP_FILES[0].name}`, `{WP_FILES[1].name}`, and `{XLSX_FILE.name}`. Planning only — no code, routes, or redirects were created.")
    lines.append("")
    lines.append("## Counts")
    lines.append("")
    lines.append(f"- Total WordPress posts: **{len(posts)}**")
    lines.append(f"- Total published posts: **{len(published_posts)}**")
    lines.append(f"- Total pages: **{len(pages)}**")
    lines.append(f"- Total published pages: **{len(published_pages)}**")
    lines.append(f"- Total Search Console URLs (Pages report): **{len(gsc_rows)}**")
    lines.append(f"- WordPress URLs matched to a Search Console row: **{len(matched)}**")
    lines.append(f"- WordPress URLs with no Search Console data (unmatched): **{len(unmatched_wp)}**")
    lines.append(f"- Search Console URLs with no corresponding WordPress post/page: **{len(unmatched_gsc)}**")
    lines.append("")
    lines.append("## Priority breakdown")
    lines.append("")
    for p in ["P0", "P1", "P2", "P3"]:
        lines.append(f"- **{p}**: {prio_counts.get(p, 0)}")
    lines.append("")
    lines.append("## Top 30 URLs by clicks")
    lines.append("")
    lines.append(table(top_clicks, ["current_url", "title", "clicks", "impressions", "priority", "recommended_action"]))
    lines.append("")
    lines.append("## Top 30 URLs by impressions")
    lines.append("")
    lines.append(table(top_impr, ["current_url", "title", "clicks", "impressions", "priority", "recommended_action"]))
    lines.append("")
    lines.append("## Recommended phase-1 migration list (all P0 URLs, highest clicks first)")
    lines.append("")
    lines.append(f"{len(phase1_sorted)} URLs. Full detail in `migration-map-draft.csv`; highest-traffic subset below.")
    lines.append("")
    lines.append(table(phase1_sorted[:40], ["current_url", "topic_cluster", "clicks", "impressions", "recommended_action", "proposed_next_url"]))
    lines.append("")
    lines.append("## Major SEO risks")
    lines.append("")
    lines.append("- **No literal same-URL preservation is possible.** The live Next.js middleware always redirects bare paths to a visible `/fa/...` prefix (confirmed in `src/middleware.ts`), and none of the ~536 WordPress URLs already contain `/fa/`. Every migrated URL needs an explicit 301, even the highest-traffic ones — there is no path that survives unchanged.")
    lines.append(f"- {sum(1 for m in map_rows if m['redirect_required']=='yes' and (m['clicks']>0 or m['impressions']>0))} URLs with real Search Console traffic require a redirect — missing any of these risks losing indexed rankings/traffic at domain cutover.")
    lines.append(f"- {sum(1 for m in map_rows if m['recommended_action']=='needs-manual-review')} URLs are marked `needs-manual-review` — these are not resolved by this audit and need a human decision before launch.")
    lines.append("- Rank Math data is present on only a subset of items (see Content quality issues) — pages without `rank_math_title`/`rank_math_description` will need fresh metadata authored for the Knowledge Center, not a straight copy.")
    if duplicate_urls:
        lines.append(f"- **{len(duplicate_urls)} live URLs are claimed by more than one WordPress post** (same permalink, different post_id) — a pre-existing WordPress data-integrity issue, not a migration artifact. Both rows are marked `needs-manual-review` in `migration-map-draft.csv`; pick the canonical post for each before migrating.")
        for u, ids in duplicate_urls.items():
            lines.append(f"  - `{u}` — post_ids {', '.join(ids)}")
    lines.append("")
    lines.append("## Content quality issues")
    lines.append("")
    thin_with_traffic = [m for m in map_rows if m["recommended_action"] == "needs-manual-review" and (m["clicks"] > 0 or m["impressions"] > 0)]
    elementor_only = [r for r in wp_records if r["has_elementor_content"] and not r["has_content"]]
    aparat_flagged = [r for r in wp_records if r["has_aparat"]]
    no_rank_math = [r for r in wp_records if not r["rank_math_title"] and r["status"] == "publish"]
    lines.append(f"- {len(thin_with_traffic)} thin/empty items still carry Search Console traffic — flagged `needs-manual-review`, not discarded, per the audit rules.")
    lines.append(f"- {len(elementor_only)} items have Elementor page-builder data but no meaningful `content:encoded` text — content exists but only inside Elementor's JSON; visible text was not auto-extracted from it and needs manual review during migration.")
    lines.append(f"- {len(aparat_flagged)} items contain an Aparat video embed (detected in content or Elementor data) — video-only or video-heavy posts need a decision on whether the embed is re-hosted or dropped.")
    lines.append(f"- {len(no_rank_math)} published posts/pages have no `rank_math_title` set — these relied on Rank Math's auto-generated title/description, which is not present in the export as authored metadata.")
    lines.append("")
    lines.append("## Technical migration notes")
    lines.append("")
    lines.append("- Real Next.js route taxonomy used for `proposed_next_url` (read from `src/content/services.ts`, `src/content/care-instructions.ts`, `src/middleware.ts`): 8 service slugs, 8 care-instruction slugs, plus `/fa/about` and `/fa/contact`. Knowledge Center (`/fa/knowledge/[slug]`) has no articles yet — every `migrate-to-knowledge-center` row needs a new slug created, not just a redirect.")
    lines.append("- `blepharoplasty` is kept as its own `topic_cluster` value per this audit's taxonomy, but the current site has no dedicated blepharoplasty **service** page — it's covered under `facial-cosmetic-surgery`. A dedicated `blepharoplasty-care` **care-instructions** page does already exist and is used for care-topic redirects.")
    lines.append("- `redirect-to-knowledge-article` is used for care-instruction matches even though the destination is a `/fa/care-instructions/...` path, not a `/fa/knowledge/...` path — the fixed action vocabulary doesn't have a dedicated care-page redirect action, so this is the closest fit. Flag if a distinct action value is wanted.")
    lines.append("- Topic classification is keyword-based (Persian phrase matching against title + categories + tags + URL slug words) — a heuristic, not a guarantee. Anything genuinely ambiguous was pushed to `needs-manual-review` rather than forced into a bucket.")
    lines.append("- URL matching between WordPress and Search Console is exact-match on the normalized URL (trailing slash stripped). No fuzzy matching was applied, so any WordPress URL that changed since the WXR export was taken (or any GSC URL with tracking params) will show up as unmatched even if it's the same real page.")
    lines.append("")

    OUT_SUMMARY.write_text("\n".join(lines), encoding="utf-8")


def main():
    wp_records, gsc_rows, map_rows, unmatched_gsc, duplicate_urls = build()

    inv_fields = [
        "type", "status", "post_id", "title", "current_url", "slug", "post_date", "modified_date",
        "content_length", "has_content", "has_elementor_content", "has_aparat", "thumbnail_id",
        "categories", "tags", "rank_math_title", "rank_math_description", "rank_math_robots",
        "rank_math_focus_keyword", "comments_count",
    ]
    write_csv(OUT_INVENTORY, inv_fields, wp_records)

    gsc_fields = ["url", "clicks", "impressions", "ctr", "position"]
    write_csv(OUT_GSC, gsc_fields, gsc_rows)

    map_fields = [
        "current_url", "type", "status", "title", "clicks", "impressions", "ctr", "position",
        "topic_cluster", "priority", "recommended_action", "proposed_next_url", "redirect_required", "notes",
    ]
    write_csv(OUT_MAP, map_fields, map_rows)

    write_summary(wp_records, gsc_rows, map_rows, unmatched_gsc, duplicate_urls)

    prio_counts = Counter(m["priority"] for m in map_rows)
    print(f"WP posts/pages parsed: {len(wp_records)}")
    print(f"GSC URLs parsed: {len(gsc_rows)}")
    print(f"Priority counts: {dict(prio_counts)}")
    print("Top 10 by clicks:")
    for m in sorted(map_rows, key=lambda m: m['clicks'], reverse=True)[:10]:
        print(f"  {m['clicks']:>6} clicks  {m['priority']}  {m['recommended_action']:<28} {m['current_url']}")


if __name__ == "__main__":
    main()
