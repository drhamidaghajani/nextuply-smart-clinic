#!/usr/bin/env python3
"""Turn legacy-redirects-spec.csv + Hamid's approved decisions (2026-08-23)
into the real src/content/legacy-redirects.ts. Path-based only — host/
protocol canonicalization (www/http) is separate logic in middleware.ts,
not a map entry."""
import csv
import json
from pathlib import Path

AUDIT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = AUDIT_DIR.parent.parent.parent
SPEC_CSV = AUDIT_DIR / "implementation-spec" / "legacy-redirects-spec.csv"
RANK_MATH_MERGE_CSV = AUDIT_DIR / "rank-math-redirects" / "rank-math-redirects-merge-plan.csv"
OUT_TS = REPO_ROOT / "src" / "content" / "legacy-redirects.ts"

# Approved decision overrides (2026-08-23) — old_path -> new_path.
# Anything NOT listed here keeps the spec's own new_path if priority == P0.
# Keys have the trailing slash stripped, matching the map's own normalization.
DECISION_OVERRIDES = {
    "/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی": "/fa/knowledge/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی",  # decision 5: Persian only
    "/بلفاروپلاستی": "/fa/knowledge/بلفاروپلاستی",  # decision 4: canonical on post_id 7212
    "/tag/متخصص-دندان-تبریز": "/fa/about",  # decision 6
}

# Stay blocked per decision 7 — never enter the map.
STILL_BLOCKED = {"/جراحی-برجستگی-پیشانی", "/نمونه-درمان"}

# Historical/renamed permalink variants surfaced in stage-2's
# unmatched-gsc-priority.csv, pointing at articles already in this phase's
# approved set — bonus protection, not in the original 33-row spec.
EXTRA_HISTORICAL_VARIANTS = {
    "/لیفت-شقیقه-گلایدینگ؛-جوانسازی-طبیعی-ب": "/fa/knowledge/لیفت-شقیقه-گلایدینگ",
    "/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود": "/fa/knowledge/جراحی-فک-پایین-عقب-رفته",
}


def js_str(s: str) -> str:
    return json.dumps(s or "", ensure_ascii=False)


def strip_fa_prefix(path: str) -> str:
    """Every destination collected below (the phase-1 spec's own new_path,
    decision overrides, historical variants, rank-math merges) was written
    as /fa/... back when /fa was the visible canonical prefix. Round
    2026-08-23 (final production URL restructuring): Persian is now root-
    based with /fa never visible, so every legacy redirect must land on the
    bare equivalent — applied here once, centrally, rather than hand-
    editing each hardcoded /fa/... string across this file's several dicts."""
    if path == "/fa":
        return "/"
    if path.startswith("/fa/"):
        return path[len("/fa"):]
    return path


def main():
    rows = list(csv.DictReader(open(SPEC_CSV, encoding="utf-8-sig")))
    entries = {}  # old_path (trailing slash stripped) -> (new_path, source_note)

    def strip_slash(p: str) -> str:
        return p[:-1] if len(p) > 1 and p.endswith("/") else p

    for r in rows:
        old_path = strip_slash(r["old_path"])
        if old_path == "/" or old_path == "":
            continue  # homepage / host-canonicalization — not a path-map entry
        if old_path in STILL_BLOCKED:
            continue  # decision 7 — leave unmapped, on purpose

        if old_path in DECISION_OVERRIDES:
            entries[old_path] = (DECISION_OVERRIDES[old_path], "decision override 2026-08-23")
        elif r["priority"] == "P0":
            entries[old_path] = (r["new_path"], "phase-1 spec")
        # any remaining P0-blocked row not covered above stays unmapped

    for old_path, new_path in EXTRA_HISTORICAL_VARIANTS.items():
        entries[old_path] = (new_path, "historical slug variant, stage-2 unmatched-gsc-priority.csv")

    rank_math_added = 0
    if RANK_MATH_MERGE_CSV.exists():
        rm_rows = list(csv.DictReader(open(RANK_MATH_MERGE_CSV, encoding="utf-8-sig")))
        for r in rm_rows:
            if r["merge_action"] != "add-to-nextjs-redirect-map":
                continue
            old_path = strip_slash(r["source_decoded"])
            if old_path in STILL_BLOCKED or old_path == "/" or old_path == "":
                continue  # defensive — should already be excluded by the merge plan itself
            if old_path in entries and entries[old_path][0] != r["final_destination"]:
                print(f"CONFLICT: rank-math source {old_path!r} already maps to {entries[old_path][0]!r}, rank-math wants {r['final_destination']!r} — skipping, keeping existing.")
                continue
            entries[old_path] = (r["final_destination"], f"rank-math redirect id {r['id']}")
            rank_math_added += 1

    lines = []
    for old_path in sorted(entries):
        new_path, note = entries[old_path]
        lines.append(f"  {js_str(old_path)}: {js_str(strip_fa_prefix(new_path))}, // {note}")

    ts = f'''/**
 * SINGLE SOURCE OF TRUTH for legacy WordPress URL redirects — phase-1 of
 * the migration in docs/migration/sadighi-wordpress-seo-audit/. Consulted
 * by src/middleware.ts BEFORE the generic bare-path rewrite, so a legacy
 * path resolves straight to its final destination in one hop instead of
 * 404ing at the old WordPress slug.
 *
 * Round 2026-08-23 (final production URL restructuring): every value here
 * is a ROOT-based path (e.g. `/knowledge/...`, `/about`) — Persian is now
 * canonical at `/`, not `/fa/...`. `strip_fa_prefix()` in this generator
 * strips the /fa/... prefix every source (the phase-1 spec CSV, decision
 * overrides, historical variants, the Rank Math merge) was originally
 * written with, so this file only ever needed updating once, centrally,
 * not by hand-editing every hardcoded string.
 *
 * Keys are pathnames with the trailing slash stripped (WordPress URLs all
 * had one; Next's routing does not) — src/middleware.ts normalizes incoming
 * pathnames the same way before looking up this map.
 *
 * {len(entries)} entries: {sum(1 for n, note in entries.values() if note == "phase-1 spec")} from the phase-1
 * P0-LAUNCH spec (legacy-redirects-spec.csv), 3 resolved by Hamid's
 * explicit decisions (2026-08-23) that were originally P0-blocked (the
 * بلفاروپلاستی collision, the fat-injection FAQ collision's Persian post,
 * and the /tag/متخصص-دندان-تبریز/ archive -> /about), 2 bonus
 * historical/renamed-permalink variants for articles already in this set
 * (from stage-2's unmatched-gsc-priority.csv), and {rank_math_added} merged in
 * from the Rank Math redirect audit (rank-math-redirects/rank-math-redirects-
 * merge-plan.csv) — Rank Math's own `destination` column pointed at OTHER
 * old WordPress URLs, not Next.js paths, so each of those {rank_math_added} rows is a
 * 2-hop chain (rank-math source -> old WP page -> this map's existing
 * target) collapsed here into one direct rule.
 *
 * Deliberately EXCLUDED, per Hamid's explicit "keep blocked" instruction —
 * do not add these until their content has been manually reviewed and a
 * destination confirmed (see manual-decisions-needed.md item 4, and
 * rank-math-redirects-summary.md's "Blocked" section for the matching
 * rank-math alias):
 *   - /جراحی-برجستگی-پیشانی/
 *   - /نمونه-درمان/
 *
 * Also excluded: the bare homepage path ("/") and the www/http host
 * variants — those are handled by separate host-canonicalization logic in
 * middleware.ts, not a path-to-path entry here. And 26 further Rank Math
 * rows classified `out-of-scope-low-priority` (destination is a WordPress
 * post not yet in any approved phase) or an English-locale alias — see the
 * merge plan for the full list, not repeated here.
 */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {{
{chr(10).join(lines)}
}};
'''
    OUT_TS.write_text(ts, encoding="utf-8")
    print(f"Wrote {len(entries)} redirect entries -> {OUT_TS} ({rank_math_added} from rank-math merge)")
    blocked_in_spec = [r["old_path"] for r in rows if strip_slash(r["old_path"]) in STILL_BLOCKED]
    print(f"Still blocked (excluded): {blocked_in_spec}")


if __name__ == "__main__":
    main()
