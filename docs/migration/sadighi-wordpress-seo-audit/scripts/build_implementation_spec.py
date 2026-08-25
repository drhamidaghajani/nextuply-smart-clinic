#!/usr/bin/env python3
"""
Stage 3: turn the phase-1 plan into an implementation-ready spec.
Reads only CSVs already produced by stages 1-2. Planning-only — writes into
implementation-spec/, touches nothing in the Next.js app.
"""
import csv
from pathlib import Path
from urllib.parse import urlparse

BASE = Path(__file__).resolve().parent.parent
OUT_DIR = BASE / "implementation-spec"
OUT_DIR.mkdir(exist_ok=True)

P0_CSV = BASE / "phase-1-plan" / "p0-launch-list.csv"
UNMATCHED_CSV = BASE / "phase-1-plan" / "unmatched-gsc-priority.csv"
INV_CSV = BASE / "wordpress-content-inventory.csv"

CANONICAL_HOST = "https://dralirezasadighi.com"


def load_csv(path):
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def write_csv(path, fieldnames, rows):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def normalize_url(u: str) -> str:
    u = (u or "").strip()
    if u.endswith("/") and len(u) > len("https://x/"):
        u = u.rstrip("/")
    return u


def path_of(url: str) -> str:
    return urlparse(url).path or "/"


def destination_readiness_note(new_path: str) -> str:
    """Existing routes (services/about/contact/care-instructions) already
    render real pages today — only the redirect rule itself is missing.
    /fa/knowledge/<slug> routes exist but each slug's content does not
    (today's Knowledge Center is 3 hardcoded demo articles) — those redirects
    are gated on the article actually being authored, not just wired."""
    if not new_path:
        return ""
    if new_path.startswith("/fa/knowledge/"):
        return "Destination article does not exist yet — do not enable this redirect until the Knowledge Center article is authored and published (see phase-1-article-import-list.csv)."
    return "Destination page already exists in the current Next.js app — this redirect can be implemented and enabled immediately, independent of content work."


# ---------------------------------------------------------------------------
# 1. legacy-redirects-spec.csv
# ---------------------------------------------------------------------------
def build_legacy_redirects(p0_rows, unmatched_rows):
    out = []

    # -- the 30 P0-LAUNCH URLs --
    for r in p0_rows:
        old_url = r["current_url"]
        old_path = path_of(old_url)
        action = r["recommended_action"]
        proposed = r["proposed_next_url"]
        manual = r["manual_review_required"] == "yes"

        if old_path == "/":
            # Homepage: no per-path redirect rule needed — it becomes the
            # new homepage and is already covered by the existing generic
            # locale-prefix redirect in src/middleware.ts.
            out.append({
                "old_url": old_url,
                "old_path": "/",
                "old_host_variant": "apex-https (canonical)",
                "new_url": f"{CANONICAL_HOST}/fa",
                "new_path": "/fa",
                "status_code": "301",
                "redirect_reason": "Current WordPress front page becomes the new homepage — no legacy-path mapping needed.",
                "priority": "P0",
                "must_resolve_before_locale_middleware": "no",
                "notes": "Already handled by the existing bare-path → /fa redirect in src/middleware.ts. Listed for completeness, not a new rule.",
            })
            continue

        new_path = path_of(proposed) if proposed else ""
        new_url = f"{CANONICAL_HOST}{new_path}" if new_path else ""
        priority = "P0-blocked" if manual else "P0"
        reason = {
            "migrate-to-knowledge-center": "High-traffic core-service article migrated into the Knowledge Center.",
            "redirect-to-home-or-about": "Structural page (about/contact) — consolidated into its Next.js equivalent.",
            "needs-manual-review": "Destination not yet decided — see manual-decisions-needed.md.",
        }.get(action, action)

        notes = destination_readiness_note(new_path) if new_url else "PENDING — see manual-decisions-needed.md before implementing this rule."

        out.append({
            "old_url": old_url,
            "old_path": old_path,
            "old_host_variant": "apex-https (canonical)",
            "new_url": new_url,
            "new_path": new_path,
            "status_code": "301",
            "redirect_reason": reason,
            "priority": priority,
            "must_resolve_before_locale_middleware": "yes",
            "notes": notes,
        })

    # -- urgent unmatched/canonical additions --
    extra_urls = {
        normalize_url("http://www.dralirezasadighi.com/"),
        normalize_url("https://dralirezasadighi.com/tag/متخصص-دندان-تبریز/"),
        normalize_url("https://dralirezasadighi.com/tag/جراحی-ایمپلنت-تبریز/"),
    }
    for r in unmatched_rows:
        if normalize_url(r["url"]) not in extra_urls:
            continue
        old_url = r["url"]
        parsed = urlparse(old_url)
        old_path = parsed.path or "/"
        is_host_variant = parsed.hostname != "dralirezasadighi.com" or parsed.scheme != "https"
        proposed = r["proposed_next_url"]
        new_path = proposed if proposed else ""
        new_url = f"{CANONICAL_HOST}{new_path}" if new_path else ""
        manual = r["recommended_action"] == "needs-manual-review"

        if is_host_variant:
            host_variant = f"{parsed.scheme}://{parsed.netloc} (non-canonical)"
            reason = "Host/protocol canonicalization — www and/or http tracked as a separate Search Console property carrying real impression volume."
            notes = ("This single indexed variant is the only one Search Console shows, but the same "
                     "canonicalization rule should match ANY combination of non-canonical host (www) or "
                     "non-https scheme, not just this exact string — e.g. https://www.… and http://dralirezasadighi.com/… too.")
        else:
            host_variant = "apex-https (canonical)"
            reason = r["notes"]
            notes = destination_readiness_note(new_path) if new_url else "PENDING — no confident single-topic redirect target, see manual-decisions-needed.md."

        out.append({
            "old_url": old_url,
            "old_path": old_path,
            "old_host_variant": host_variant,
            "new_url": new_url,
            "new_path": new_path,
            "status_code": "301",
            "redirect_reason": reason,
            "priority": "P0-blocked" if (manual or not new_url) else "P0",
            "must_resolve_before_locale_middleware": "yes",
            "notes": notes,
        })

    return out


# ---------------------------------------------------------------------------
# 2. phase-1-article-import-list.csv
# ---------------------------------------------------------------------------
SERVICE_URL = {
    "orthognathic-surgery": "orthognathic-surgery",
    "advanced-dental-implant": "advanced-dental-implant",
    "impacted-tooth-surgery": "impacted-tooth-surgery",
    "rhinoplasty": "rhinoplasty",
    "facial-cosmetic-surgery": "facial-cosmetic-surgery",
    "blepharoplasty": "facial-cosmetic-surgery",
}


def build_article_import_list(p0_rows, inv_by_url):
    out = []
    for r in p0_rows:
        if r["recommended_action"] != "migrate-to-knowledge-center":
            continue
        norm = normalize_url(r["current_url"])
        iv = inv_by_url.get(norm)
        proposed = r["proposed_next_url"]
        slug = proposed.rsplit("/", 1)[-1] if proposed else ""

        seo_title_source = "rank_math_title (reuse, review for length)" if iv and iv["rank_math_title"].strip() else "none — author fresh seoTitle from H1/topic"
        seo_desc_source = "rank_math_description (reuse, review for length)" if iv and iv["rank_math_description"].strip() else "none — author fresh seoDescription"
        has_thumbnail = bool(iv and iv["thumbnail_id"].strip())
        has_aparat = iv["has_aparat"] == "True" if iv else False

        manual_notes = []
        if has_thumbnail:
            manual_notes.append(f"WordPress thumbnail_id {iv['thumbnail_id']} exists but the WXR export carries only attachment metadata, not the file — the actual image must be fetched from the live site (or the original media library) before import.")
        else:
            manual_notes.append("No WordPress featured image on record — a new heroImage must be sourced/commissioned.")
        if not (iv and iv["rank_math_focus_keyword"].strip()):
            manual_notes.append("No Rank Math focus keyword recorded — confirm target keyword during rewrite.")

        out.append({
            "old_url": r["current_url"],
            "title": r["title"],
            "topic_cluster": r["topic_cluster"],
            "proposed_slug": slug,
            "proposed_path": proposed,
            "content_quality": r["current_content_quality"],
            "needs_rewrite": "yes",
            "needs_media_import": "yes" if has_thumbnail else "yes (no source image — must be sourced fresh)",
            "has_aparat": "yes" if has_aparat else "no",
            "related_service": f"/fa/services/{SERVICE_URL.get(r['topic_cluster'], '')}" if r["topic_cluster"] in SERVICE_URL else "",
            "seo_title_source": seo_title_source,
            "seo_description_source": seo_desc_source,
            "manual_notes": " ".join(manual_notes),
        })
    return out


def main():
    p0_rows = load_csv(P0_CSV)
    unmatched_rows = load_csv(UNMATCHED_CSV)
    inv_rows = load_csv(INV_CSV)
    inv_by_url = {normalize_url(r["current_url"]): r for r in inv_rows}

    redirect_rows = build_legacy_redirects(p0_rows, unmatched_rows)
    redirect_fields = [
        "old_url", "old_path", "old_host_variant", "new_url", "new_path",
        "status_code", "redirect_reason", "priority",
        "must_resolve_before_locale_middleware", "notes",
    ]
    write_csv(OUT_DIR / "legacy-redirects-spec.csv", redirect_fields, redirect_rows)

    article_rows = build_article_import_list(p0_rows, inv_by_url)
    article_fields = [
        "old_url", "title", "topic_cluster", "proposed_slug", "proposed_path",
        "content_quality", "needs_rewrite", "needs_media_import", "has_aparat",
        "related_service", "seo_title_source", "seo_description_source", "manual_notes",
    ]
    write_csv(OUT_DIR / "phase-1-article-import-list.csv", article_fields, article_rows)

    print(f"legacy-redirects-spec.csv: {len(redirect_rows)} rows")
    print(f"  P0 (ready): {sum(1 for r in redirect_rows if r['priority']=='P0')}")
    print(f"  P0-blocked (pending manual decision): {sum(1 for r in redirect_rows if r['priority']=='P0-blocked')}")
    print(f"phase-1-article-import-list.csv: {len(article_rows)} rows")


if __name__ == "__main__":
    main()
