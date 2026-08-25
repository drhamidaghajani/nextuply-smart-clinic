#!/usr/bin/env python3
"""
Stage 2: refine the stage-1 audit (migration-map-draft.csv etc.) into a
launch-safe phase-1 plan. Reads only the CSVs already produced by
build_audit.py — does not re-parse the WXR/XLSX. Planning-only: writes into
phase-1-plan/, touches nothing in the Next.js app.
"""
import csv
import re
from collections import OrderedDict
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
OUT_DIR = BASE / "phase-1-plan"
OUT_DIR.mkdir(exist_ok=True)

MAP_CSV = BASE / "migration-map-draft.csv"
GSC_CSV = BASE / "search-console-url-performance.csv"
INV_CSV = BASE / "wordpress-content-inventory.csv"

CORE_TOPICS_ORDERED = [
    "orthognathic-surgery", "advanced-dental-implant", "impacted-tooth-surgery",
    "rhinoplasty", "blepharoplasty", "facial-cosmetic-surgery",
    "care-instructions", "doctor-profile", "clinic-info",
]

COLLISION_URLS = {
    "https://dralirezasadighi.com/بلفاروپلاستی/",
    "https://dralirezasadighi.com/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی/",
}


def normalize_url(u: str) -> str:
    u = (u or "").strip()
    if u.endswith("/") and len(u) > len("https://x/"):
        u = u.rstrip("/")
    return u


def load_csv(path):
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def write_csv(path, fieldnames, rows):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def content_quality(inv_row) -> str:
    if not inv_row:
        return "unknown"
    has_content = inv_row["has_content"] == "True"
    has_elementor = inv_row["has_elementor_content"] == "True"
    has_aparat = inv_row["has_aparat"] == "True"
    length = int(inv_row["content_length"] or 0)
    if has_content and length >= 400:
        return "strong"
    if has_content:
        return "moderate"
    if has_elementor or has_aparat:
        return "thin-elementor-only"
    return "empty"


# ---------------------------------------------------------------------------
# 1. p0-launch-list.csv
# ---------------------------------------------------------------------------
def build_p0_launch_list(map_rows, inv_by_url):
    # Dedupe collision URLs to one row each (keep the row with the longer/more
    # content post_id isn't knowable here; keep first occurrence, list both
    # post_ids from the inventory in notes).
    seen_urls = set()
    rows = []
    for r in map_rows:
        norm = normalize_url(r["current_url"])
        if norm in seen_urls:
            continue
        seen_urls.add(norm)
        rows.append(r)

    for r in rows:
        r["_clicks"] = int(r["clicks"])
        r["_impr"] = int(r["impressions"])
        r["_inv"] = inv_by_url.get(normalize_url(r["current_url"]))
        r["_quality"] = content_quality(r["_inv"])
        r["_is_collision"] = normalize_url(r["current_url"]) in {normalize_url(u) for u in COLLISION_URLS}

    # Eligibility: has real traffic, OR is a core-topic page with non-thin
    # content, OR is a structural page (doctor-profile/clinic-info), OR is
    # the homepage, OR is a flagged collision (traffic already covers these
    # in practice, but force-eligible regardless).
    def eligible(r):
        if r["_clicks"] > 0 or r["_impr"] > 0:
            return True
        if r["topic_cluster"] in CORE_TOPICS_ORDERED and r["_quality"] in ("strong", "moderate"):
            return True
        if r["_is_collision"]:
            return True
        return False

    pool = [r for r in rows if eligible(r)]

    # Rank: clicks desc, then impressions desc as tiebreak/fill criterion.
    by_clicks = sorted(pool, key=lambda r: (r["_clicks"], r["_impr"]), reverse=True)

    selected = []
    selected_urls = set()

    def add(r):
        u = normalize_url(r["current_url"])
        if u not in selected_urls:
            selected.append(r)
            selected_urls.add(u)

    # Force-include structural must-protect pages regardless of rank — but
    # only published, cleanly-addressable ones (a draft `?page_id=` duplicate
    # with zero traffic is exactly the "thin/duplicate/ambiguous" content the
    # selection rules say to leave out).
    for r in rows:
        is_structural = r["topic_cluster"] in ("doctor-profile", "clinic-info")
        is_homepage = normalize_url(r["current_url"]) == normalize_url("https://dralirezasadighi.com/")
        if (is_structural or is_homepage) and r["status"] == "publish" and "?" not in r["current_url"]:
            add(r)
    for r in rows:
        if r["_is_collision"]:
            add(r)

    # Fill by clicks first.
    for r in by_clicks:
        if len(selected) >= 30:
            break
        if r["_clicks"] <= 0:
            break
        add(r)

    # Fill remaining slots (target ~30) by impressions among core-topic pages.
    by_impr = sorted(pool, key=lambda r: r["_impr"], reverse=True)
    for r in by_impr:
        if len(selected) >= 30:
            break
        if r["topic_cluster"] not in CORE_TOPICS_ORDERED:
            continue
        add(r)

    # Cap at 35, floor at 25 by relaxing impressions fill if needed.
    if len(selected) < 25:
        for r in by_impr:
            if len(selected) >= 25:
                break
            add(r)
    selected = selected[:35]

    selected.sort(key=lambda r: (r["_clicks"], r["_impr"]), reverse=True)

    out_rows = []
    for r in selected:
        norm = normalize_url(r["current_url"])
        is_collision = r["_is_collision"]

        action = r["recommended_action"]
        proposed = r["proposed_next_url"]
        redirect_required = r["redirect_required"]
        reason_parts = []

        if norm == normalize_url("https://dralirezasadighi.com/"):
            action = "keep-same-url"
            proposed = "/fa"
            redirect_required = "no"
            reason_parts.append("Current homepage — becomes the new homepage; the existing locale middleware already redirects bare `/` to `/fa`, no custom redirect rule needed.")
        elif is_collision:
            action = "needs-manual-review"
            other = [ir["post_id"] for u, ir in inv_by_url.items() if normalize_url(u) == norm]
            reason_parts.append(f"URL COLLISION — {len(other)} WordPress posts share this exact URL (post_ids: {', '.join(other)}); pick the canonical one before migrating, see collision-review.md.")
        elif r["topic_cluster"] in ("doctor-profile", "clinic-info"):
            reason_parts.append("Structural page (about/contact) — must resolve cleanly at launch regardless of traffic volume, patients and referral links depend on it.")

        if r["_clicks"] >= 50:
            reason_parts.append(f"High click volume ({r['_clicks']} clicks) — real organic traffic at risk of loss if this 404s.")
        elif r["_clicks"] > 0:
            reason_parts.append(f"Has recorded clicks ({r['_clicks']}) on a core-service topic ({r['topic_cluster']}).")
        elif r["_impr"] >= 1000:
            reason_parts.append(f"High impression volume ({r['_impr']}) on core topic {r['topic_cluster']} — ranking already, low CTR risk if it silently disappears.")
        elif r["topic_cluster"] in CORE_TOPICS_ORDERED:
            reason_parts.append(f"Core-service topic ({r['topic_cluster']}) with usable content — strategically important even at current low traffic.")

        manual_review = action == "needs-manual-review"

        notes = r["notes"]
        if is_collision:
            notes = f"See collision-review.md for full resolution. {notes}"

        out_rows.append({
            "current_url": r["current_url"],
            "title": r["title"],
            "clicks": r["_clicks"],
            "impressions": r["_impr"],
            "ctr": r["ctr"],
            "position": r["position"],
            "topic_cluster": r["topic_cluster"],
            "current_content_quality": r["_quality"],
            "recommended_action": action,
            "proposed_next_url": proposed,
            "redirect_required": redirect_required,
            "reason_for_p0_launch": " ".join(reason_parts) if reason_parts else "Selected to fill phase-1 quota by impression volume within a core-service topic.",
            "manual_review_required": "yes" if manual_review else "no",
            "notes": notes,
        })

    return out_rows


# ---------------------------------------------------------------------------
# 2. unmatched-gsc-priority.csv
# ---------------------------------------------------------------------------
TAG_TOPIC_HINTS = [
    (["ایمپلنت"], "advanced-dental-implant"),
    (["دندان-عقل", "نهفته"], "impacted-tooth-surgery"),
    (["جراحی-فک", "فک-نی-نی", "چانه"], "orthognathic-surgery"),
    (["بینی"], "rhinoplasty"),
    (["بلفارو", "پلک"], "blepharoplasty"),
    (["زیبایی", "شقیقه", "لیفت"], "facial-cosmetic-surgery"),
    (["مراقبت"], "care-instructions"),
    (["دکتر-علیرضا-صدیقی", "کلینیک"], "doctor-profile"),
]

SERVICE_URL = {
    "orthognathic-surgery": "/fa/services/orthognathic-surgery",
    "advanced-dental-implant": "/fa/services/advanced-dental-implant",
    "impacted-tooth-surgery": "/fa/services/impacted-tooth-surgery",
    "rhinoplasty": "/fa/services/rhinoplasty",
    "facial-cosmetic-surgery": "/fa/services/facial-cosmetic-surgery",
    "blepharoplasty": "/fa/services/facial-cosmetic-surgery",
}


def classify_unmatched(url: str) -> str:
    path = re.sub(r"^https?://(www\.)?dralirezasadighi\.com", "", url)
    if path in ("", "/"):
        return "homepage"
    if "?" in url or "?" in path:
        return "query-string"
    if path.startswith("/tag/"):
        return "tag"
    if path.startswith("/category/"):
        return "category"
    if path.startswith("/blog/") or path.startswith("/blog-en"):
        return "category"
    if path.startswith("/wp-content/") or path.startswith("/wp-json/") or re.search(r"\.(jpg|jpeg|png|gif|pdf|svg|webp)$", path, re.I):
        return "media"
    return "unknown"


def find_sibling_match(url: str, map_by_url_prefix):
    """Detect an unmatched URL that is a longer/older verbose variant of an
    already-migrated post's current slug (e.g. an old permalink that was later
    shortened, but Search Console still shows historical impressions for it).

    Deliberately one-directional: only `unmatched_slug.startswith(candidate_slug)`
    counts (the unmatched URL is the longer, older one). The reverse direction
    (a short unmatched slug being a prefix of a longer candidate) is NOT treated
    as a match — that pattern is just as likely to be a generic hub/index page
    (e.g. `/سوالات-متداول/`) sharing a word with several unrelated, more specific
    posts (`سوالات-متداول-ایمپلنت`, `سوالات-متداول-بلفاروپلاستی`), not a renamed
    variant of any single one of them.
    """
    slug = re.sub(r"^https?://(www\.)?dralirezasadighi\.com/?", "", url).rstrip("/")
    candidates = []
    for candidate_url, candidate_row in map_by_url_prefix.items():
        candidate_slug = candidate_url.rstrip("/").rsplit("/", 1)[-1]
        if candidate_slug and len(candidate_slug) > 8 and slug != candidate_slug and slug.startswith(candidate_slug):
            candidates.append(candidate_row)
    if len(candidates) == 1:
        return candidates[0]
    return None  # zero or ambiguous (multiple) matches — leave to manual review


def build_unmatched_gsc(gsc_rows, matched_urls, map_rows):
    unmatched = [r for r in gsc_rows if normalize_url(r["url"]) not in matched_urls]
    for r in unmatched:
        r["_clicks"] = int(float(r["clicks"]))
        r["_impr"] = int(float(r["impressions"]))

    top_clicks = sorted(unmatched, key=lambda r: r["_clicks"], reverse=True)[:50]
    top_impr = sorted(unmatched, key=lambda r: r["_impr"], reverse=True)[:50]

    seen = set()
    combined = []
    for r in top_clicks + top_impr:
        u = normalize_url(r["url"])
        if u in seen:
            continue
        seen.add(u)
        combined.append(r)
    combined.sort(key=lambda r: (r["_clicks"], r["_impr"]), reverse=True)

    map_by_url = {normalize_url(r["current_url"]): r for r in map_rows}

    out_rows = []
    for r in combined:
        url = r["url"]
        likely_type = classify_unmatched(url)
        action, proposed, note = "needs-manual-review", "", ""

        if likely_type == "homepage":
            action = "redirect-to-home-or-about"
            proposed = "/fa"
            note = "Host/protocol variant of the homepage (www and/or http) tracked as a separate Search Console URL — canonicalize with a 301 to the https apex + /fa."
        elif likely_type == "tag":
            matched_topic = None
            for hints, topic in TAG_TOPIC_HINTS:
                if any(h in url for h in hints):
                    matched_topic = topic
                    break
            if matched_topic and matched_topic in SERVICE_URL:
                action, proposed = "redirect-to-service-page", SERVICE_URL[matched_topic]
                note = f"WordPress tag archive; no tag-archive equivalent on the new site — redirect to the closest service page ({matched_topic})."
            elif matched_topic == "care-instructions":
                action, proposed = "redirect-to-home-or-about", "/fa/care-instructions"
                note = "WordPress tag archive covering care topics — redirect to the care-instructions index."
            elif matched_topic == "doctor-profile":
                action, proposed = "redirect-to-home-or-about", "/fa/about"
                note = "WordPress tag archive about the doctor/clinic brand — redirect to About."
            else:
                note = "WordPress tag archive with no clear single-topic match — pick a redirect target manually (or accept as a 404 if traffic is trivial)."
        elif likely_type == "category":
            matched_topic = None
            for hints, topic in TAG_TOPIC_HINTS:
                if any(h in url for h in hints):
                    matched_topic = topic
                    break
            if matched_topic and matched_topic in SERVICE_URL:
                action, proposed = "redirect-to-service-page", SERVICE_URL[matched_topic]
                note = "WordPress blog/category archive; redirect to the closest matching service page."
            else:
                note = "WordPress blog/category archive — no direct Knowledge Center category-index equivalent exists yet; needs a manual decision (build a category index, or redirect to /fa/knowledge)."
        elif likely_type == "media":
            action, proposed, note = "do-not-migrate", "", "Media/asset URL — not content; safe to let 404 or handle via generic asset redirect, not a per-URL SEO concern."
        elif likely_type == "query-string":
            action, proposed, note = "do-not-migrate", "", "Query-string variant of another URL (pagination, filters, tracking) — not a distinct page; ignore unless traffic is unexpectedly high."
        else:
            sibling = find_sibling_match(url, map_by_url)
            if sibling:
                action = "redirect-to-knowledge-article"
                proposed = sibling.get("proposed_next_url") or ""
                note = (f"Looks like a historical/renamed permalink for the already-migrated post \"{sibling['title']}\" "
                        f"({sibling['current_url']}) — redirect straight to that post's new URL instead of treating as new content.")
            elif "/en/" in url or url.rstrip("/").endswith("/en") or "/blog-en" in url:
                action = "needs-manual-review"
                note = "English-locale WordPress URL — decide as part of the /en locale rollout (see docs/adr/0005-locale-rollout-en-ar.md), not this Persian-first migration pass."
            else:
                note = "No confident automatic match — likely an old/renamed slug, an FAQ/utility page, or orphaned content. Needs manual look before deciding."

        out_rows.append({
            "url": url,
            "clicks": r["_clicks"],
            "impressions": r["_impr"],
            "ctr": r["ctr"],
            "position": r["position"],
            "likely_type": likely_type,
            "recommended_action": action,
            "proposed_next_url": proposed,
            "notes": note,
        })
    return out_rows


# ---------------------------------------------------------------------------
# 3. collision-review.md
# ---------------------------------------------------------------------------
def is_latin_title(title: str) -> bool:
    letters = [c for c in title if c.isalpha()]
    if not letters:
        return False
    latin = sum(1 for c in letters if c.isascii())
    return latin / len(letters) > 0.6


def build_collision_review(inv_rows, map_rows, gsc_by_url):
    inv_by_id = {r["post_id"]: r for r in inv_rows}
    map_by_url = {}
    for r in map_rows:
        map_by_url.setdefault(normalize_url(r["current_url"]), []).append(r)

    lines = ["# Collision Review — Duplicate Live URLs\n"]
    lines.append(
        "Two WordPress URLs each resolve to two different published posts (same permalink, "
        "different `post_id`). WordPress can only actually serve one of them on the live site "
        "at any given time. The two cases below turn out to have different root causes — one is "
        "a genuine duplicate Persian post, the other is a Persian/English translation pair that "
        "never got separate slugs — so each needs a different fix, not a single generic rule. "
        "Neither is something the migration script can resolve automatically; a human needs to "
        "confirm the call before either post is migrated.\n"
    )

    for url in sorted(COLLISION_URLS):
        norm = normalize_url(url)
        rows = [r for r in inv_rows if normalize_url(r["current_url"]) == norm]
        gsc = gsc_by_url.get(norm)
        lines.append(f"## `{url}`\n")
        if gsc:
            lines.append(f"**Combined Search Console traffic for this URL:** {gsc['clicks']} clicks, {gsc['impressions']} impressions, position {gsc['position']} — "
                          "attributed to whichever post Google actually crawled last; cannot be split between the two post_ids from GSC data alone.\n")
        else:
            lines.append("**Search Console traffic:** no matching row found.\n")

        lines.append("| post_id | title | status | post_date | modified_date | content_length | has_content | has_elementor_content |")
        lines.append("|---|---|---|---|---|---|---|---|")
        for r in rows:
            lines.append(f"| {r['post_id']} | {r['title']} | {r['status']} | {r['post_date']} | {r['modified_date']} | {r['content_length']} | {r['has_content']} | {r['has_elementor_content']} |")
        lines.append("")

        if len(rows) == 2:
            a, b = rows[0], rows[1]
            a_latin, b_latin = is_latin_title(a["title"]), is_latin_title(b["title"])

            if a_latin != b_latin and a["post_date"] == b["post_date"]:
                # Same publish timestamp to the second, one Persian title one
                # English title — this is a bilingual FAQ pair, not a true
                # content duplicate. The bug is that the English post never
                # got its own slug, not that one post should be discarded.
                fa_post = a if not a_latin else b
                en_post = b if not a_latin else a
                lines.append(f"**Diagnosis: bilingual pair, not a true duplicate.** Both posts were published at the exact same timestamp (`{a['post_date']}`) — post_id {fa_post['post_id']} is the Persian article, post_id {en_post['post_id']} is its English translation (\"{en_post['title']}\"). The English post was never given its own slug and silently inherited the Persian one, so only one of the two has ever actually been reachable at this URL.\n")
                lines.append(f"**Recommended canonical item for this URL: post_id {fa_post['post_id']}** (Persian) — this is the primary-market content and should keep the Persian slug.\n")
                lines.append(f"**Recommended redirect/merge behavior:** migrate post_id {fa_post['post_id']} into the Knowledge Center at the Persian URL. Do not discard post_id {en_post['post_id']} — it is real, distinct content — instead give it its own English-locale slug (e.g. under `/en/...`, consistent with the en/ar locale rollout in `docs/adr/0005-locale-rollout-en-ar.md`) rather than treating this as a canonical-vs-discard decision.\n")
                lines.append("**Reason:** the identical publish timestamp across two different-language titles is a strong signal this came from a translation workflow (e.g. a multilingual plugin) that failed to assign the translated post its own slug, not from someone duplicating a Persian post.\n")
            else:
                newer = a if a["modified_date"] > b["modified_date"] else b
                richer = a if int(a["content_length"]) >= int(b["content_length"]) else b
                other = b if newer is a else a
                lines.append(f"**Most recently modified:** post_id {newer['post_id']} (`{newer['modified_date']}`).")
                lines.append(f"**Longer/richer content:** post_id {richer['post_id']} (`{richer['content_length']}` chars).\n")
                if newer["post_id"] == richer["post_id"]:
                    lines.append(f"**Recommended canonical item: post_id {newer['post_id']}** — it is both the most recently modified and the more substantial version; treat it as the source of truth for the migrated article.\n")
                    lines.append(f"**Recommended redirect/merge behavior:** migrate post_id {newer['post_id']}'s content into the Knowledge Center at the proposed URL; permanently retire post_id {other['post_id']} with no separate URL of its own (it never had one — same permalink).\n")
                else:
                    lines.append(f"**Recommended canonical item: post_id {newer['post_id']}** (most recently modified) — but check post_id {richer['post_id']} manually before discarding it, since it holds more content; the newer post may be a shorter rewrite or an unrelated placeholder that reused the slug.\n")
                lines.append("**Reason:** WordPress permalinks are unique per post in normal operation — two posts sharing one exactly probably means one was originally created, then a second post was later given the same slug (e.g. through a copy/duplicate action, a translation plugin misconfiguration, or a manual slug edit) without the first being deleted or its slug freed up. Only one has actually been reachable on the live site at any given time; Search Console traffic reflects whichever version Google most recently crawled, not both.\n")
        lines.append("---\n")

    OUT_DIR.joinpath("collision-review.md").write_text("\n".join(lines), encoding="utf-8")


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
def main():
    map_rows = load_csv(MAP_CSV)
    gsc_rows = load_csv(GSC_CSV)
    inv_rows = load_csv(INV_CSV)

    inv_by_url = {normalize_url(r["current_url"]): r for r in inv_rows}
    gsc_by_url = {normalize_url(r["url"]): r for r in gsc_rows}
    matched_urls = {normalize_url(r["current_url"]) for r in map_rows}

    p0_rows = build_p0_launch_list(map_rows, inv_by_url)
    p0_fields = [
        "current_url", "title", "clicks", "impressions", "ctr", "position",
        "topic_cluster", "current_content_quality", "recommended_action",
        "proposed_next_url", "redirect_required", "reason_for_p0_launch",
        "manual_review_required", "notes",
    ]
    write_csv(OUT_DIR / "p0-launch-list.csv", p0_fields, p0_rows)

    unmatched_rows = build_unmatched_gsc(gsc_rows, matched_urls, map_rows)
    unmatched_fields = ["url", "clicks", "impressions", "ctr", "position", "likely_type", "recommended_action", "proposed_next_url", "notes"]
    write_csv(OUT_DIR / "unmatched-gsc-priority.csv", unmatched_fields, unmatched_rows)

    build_collision_review(inv_rows, map_rows, gsc_by_url)

    print(f"p0-launch-list.csv: {len(p0_rows)} rows")
    print(f"unmatched-gsc-priority.csv: {len(unmatched_rows)} rows")
    print("Top 10 p0-launch-list:")
    for r in p0_rows[:10]:
        print(f"  {r['clicks']:>6} clicks  {r['recommended_action']:<28} {r['current_url']}")

    return p0_rows, unmatched_rows


if __name__ == "__main__":
    main()
