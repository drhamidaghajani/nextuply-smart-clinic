#!/usr/bin/env python3
"""
Track 1: Rank Math redirect audit + merge plan.

Key fact discovered on inspection: Rank Math's `destination` column is NOT
a Next.js URL — it's another OLD WordPress URL (e.g. id=3's destination
decodes to `/ایمپلنت-فوری-در-تبریز`, itself a legacy WordPress permalink).
So every one of these 42 rows is inherently a redirect CHAIN:

    rank-math source -> old WP destination -> (maybe) already in
    LEGACY_REDIRECTS -> real Next.js destination

This script resolves that chain for each row, classifies it, and writes
the three required reports. It does NOT modify src/content/legacy-redirects.ts
itself — that's a separate, explicit step after reviewing the merge plan.
"""
import csv
import re
from pathlib import Path
from urllib.parse import unquote, urlparse

AUDIT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = AUDIT_DIR.parent.parent.parent
RANK_MATH_CSV = AUDIT_DIR / "source" / "_rank-math-redirections-2026-08-23_12-23-06.csv"
OUT_DIR = AUDIT_DIR / "rank-math-redirects"
OUT_DIR.mkdir(exist_ok=True)

LEGACY_REDIRECTS_TS = REPO_ROOT / "src" / "content" / "legacy-redirects.ts"

STILL_BLOCKED = {"/جراحی-برجستگی-پیشانی", "/نمونه-درمان"}


def normalize_path(p: str) -> str:
    """Strip protocol/domain if present, decode percent-encoding, strip trailing slash."""
    p = p.strip()
    if p.startswith("http://") or p.startswith("https://"):
        p = urlparse(p).path
    if not p.startswith("/"):
        p = "/" + p
    if "%" in p:
        try:
            p = unquote(p, encoding="utf-8", errors="strict")
        except UnicodeDecodeError:
            pass
    if len(p) > 1 and p.endswith("/"):
        p = p[:-1]
    return p


def load_legacy_redirects() -> dict:
    """Parse the real LEGACY_REDIRECTS map straight out of the .ts source
    (its own file, not re-derived) — single source of truth, not duplicated logic."""
    text = LEGACY_REDIRECTS_TS.read_text(encoding="utf-8")
    entries = {}
    for m in re.finditer(r'"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)"', text):
        key = m.group(1).encode().decode("unicode_escape") if "\\u" in m.group(1) else m.group(1)
        val = m.group(2).encode().decode("unicode_escape") if "\\u" in m.group(2) else m.group(2)
        entries[key] = val
    return entries


def load_rank_math_rows():
    with open(RANK_MATH_CSV, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def main():
    legacy = load_legacy_redirects()
    rows = load_rank_math_rows()

    normalized_rows = []
    for r in rows:
        source_norm = normalize_path(r["source"])
        dest_norm = normalize_path(r["destination"])
        normalized_rows.append({
            "id": r["id"],
            "source": r["source"],
            "source_decoded": source_norm,
            "destination": r["destination"],
            "destination_decoded": dest_norm,
            "status_code": r["type"],
            "rank_math_status": r["status"],
        })

    # write normalized CSV
    norm_fields = ["id", "source", "source_decoded", "destination", "destination_decoded", "status_code", "rank_math_status"]
    with open(OUT_DIR / "rank-math-redirects-normalized.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=norm_fields)
        w.writeheader()
        for r in normalized_rows:
            w.writerow(r)

    # Dedupe exact (source_decoded, destination_decoded) pairs BEFORE
    # classifying — a row that's byte-for-byte identical to an earlier one
    # in this same export (Rank Math itself exported it twice, e.g. id=34)
    # isn't a distinct redirect decision, it's the same rule counted twice.
    # Classifying it separately as "already-covered" produced a confusing
    # empty final_destination for a genuinely out-of-scope row — dropping
    # the repeat here means every remaining row gets one real classification.
    seen_exact = set()
    unique_rows = []
    exact_duplicates_dropped = 0
    for r in normalized_rows:
        key = (r["source_decoded"], r["destination_decoded"])
        if key in seen_exact:
            exact_duplicates_dropped += 1
            continue
        seen_exact.add(key)
        unique_rows.append(r)

    merge_rows = []

    for r in unique_rows:
        source = r["source_decoded"]
        dest = r["destination_decoded"]

        # resolve the chain: does the destination itself match something
        # already in LEGACY_REDIRECTS (or the two blocked articles)?
        final_destination = ""
        chain_risk = "none"
        conflict_risk = "none"
        destination_exists = "unknown"
        manual_review = False
        action = ""
        notes_parts = []

        if source in STILL_BLOCKED or dest in STILL_BLOCKED:
            action = "blocked-needs-manual-review"
            manual_review = True
            notes_parts.append("Source or destination is one of the two articles Hamid explicitly kept blocked for manual content review (جراحی برجستگی پیشانی / نمونه درمان) — must stay blocked, not silently redirected.")

        elif source in legacy:
            action = "already-covered"
            final_destination = legacy[source]
            notes_parts.append(f"This exact source path is already a key in LEGACY_REDIRECTS, pointing to {legacy[source]} — nothing to add.")

        elif dest in legacy:
            final_destination = legacy[dest]
            chain_risk = "resolved"
            destination_exists = "yes"
            if "/en/" in source or source.startswith("en/") or "-what-is-it-and-who-is-it-for" in source:
                action = "out-of-scope-low-priority"
                notes_parts.append(f"Destination resolves cleanly to {final_destination}, but the source itself is an English-locale-flavored alias — phase 1 is Persian-only (see knowledge/page.tsx's doc-comment). Deferred, not blocked.")
            else:
                action = "add-to-nextjs-redirect-map"
                notes_parts.append(f"Old WordPress destination ({dest}) is itself already redirected in LEGACY_REDIRECTS to {final_destination} — this row is a 2-hop chain (rank-math source -> old dest -> Next.js) collapsed into one direct rule.")

        elif dest == "/":
            action = "add-to-nextjs-redirect-map"
            final_destination = "/fa"
            chain_risk = "resolved"
            destination_exists = "yes"
            notes_parts.append("Destination is the WordPress homepage — redirect straight to /fa.")

        else:
            # destination doesn't resolve anywhere in our current map — likely
            # a WordPress post not in the Phase-1 approved article set.
            action = "out-of-scope-low-priority"
            destination_exists = "no"
            manual_review = True
            notes_parts.append(f"Destination ({dest}) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.")

        merge_rows.append({
            "id": r["id"],
            "source": r["source"],
            "source_decoded": source,
            "destination": r["destination"],
            "destination_decoded": dest,
            "final_destination": final_destination,
            "status_code": r["status_code"],
            "merge_action": action,
            "chain_risk": chain_risk,
            "conflict_risk": conflict_risk,
            "destination_exists": destination_exists,
            "manual_review_required": "yes" if manual_review else "no",
            "notes": " ".join(notes_parts),
        })

    merge_fields = [
        "id", "source", "source_decoded", "destination", "destination_decoded",
        "final_destination", "status_code", "merge_action", "chain_risk",
        "conflict_risk", "destination_exists", "manual_review_required", "notes",
    ]
    with open(OUT_DIR / "rank-math-redirects-merge-plan.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=merge_fields)
        w.writeheader()
        for r in merge_rows:
            w.writerow(r)

    # summary
    from collections import Counter
    action_counts = Counter(r["merge_action"] for r in merge_rows)
    to_add = [r for r in merge_rows if r["merge_action"] == "add-to-nextjs-redirect-map"]

    lines = []
    lines.append("# Rank Math Redirect Audit — Summary\n")
    lines.append(f"Parsed **{len(rows)}** rows from `{RANK_MATH_CSV.name}` — {exact_duplicates_dropped} were byte-for-byte duplicates of an earlier row in the same export and were merged/dropped before classification, leaving **{len(unique_rows)}** unique redirect rules evaluated below.\n")
    lines.append("## Key finding\n")
    lines.append(
        "Rank Math's `destination` column is not a Next.js URL — every row points at another **old WordPress URL** "
        "(e.g. row id=3's destination decodes to `/ایمپلنت-فوری-در-تبریز`, itself a legacy permalink). Every row is "
        "therefore inherently a 2-hop chain (`rank-math source → old WP page → wherever that old WP page's own redirect "
        "points`), resolved here by checking whether the destination is already a key in `LEGACY_REDIRECTS` — if so, the "
        "chain collapses into one direct rule from the rank-math source straight to the real Next.js destination.\n"
    )
    lines.append("## merge_action breakdown\n")
    for action, count in action_counts.most_common():
        lines.append(f"- **{action}**: {count}")
    lines.append("")
    lines.append(f"## Rows to add ({len(to_add)})\n")
    lines.append("| id | source | final_destination |")
    lines.append("|---|---|---|")
    for r in to_add:
        lines.append(f"| {r['id']} | `{r['source_decoded']}` | `{r['final_destination']}` |")
    lines.append("")
    lines.append("## Blocked (kept out, per Hamid's instruction)\n")
    for r in merge_rows:
        if r["merge_action"] == "blocked-needs-manual-review":
            lines.append(f"- id {r['id']}: `{r['source_decoded']}` → `{r['destination_decoded']}`")
    lines.append("")
    lines.append("## Out of scope (destination not yet migrated, or English-locale alias)\n")
    for r in merge_rows:
        if r["merge_action"] == "out-of-scope-low-priority":
            lines.append(f"- id {r['id']}: `{r['source_decoded']}` → `{r['destination_decoded']}` ({r['notes']})")
    lines.append("")

    (OUT_DIR / "rank-math-redirects-summary.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"Parsed {len(rows)} rank-math rows.")
    print(f"Action counts: {dict(action_counts)}")
    print(f"To add: {len(to_add)}")
    for r in to_add:
        print(f"  {r['source_decoded']} -> {r['final_destination']}")


if __name__ == "__main__":
    main()
