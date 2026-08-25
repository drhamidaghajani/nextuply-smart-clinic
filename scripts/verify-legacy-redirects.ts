/**
 * Static verification of the 33-row phase-1 legacy-redirect spec
 * (docs/migration/sadighi-wordpress-seo-audit/implementation-spec/
 * legacy-redirects-spec.csv) against what's actually implemented in
 * `src/content/legacy-redirects.ts` + `src/middleware.ts`'s
 * `resolveLegacyPath`/`resolveHostCanonicalization`.
 *
 * Deliberately static, not a live HTTP check against a running dev
 * server — this is a data-integrity + pure-function test, fast and
 * deterministic, and doesn't touch (or require) any dev server the user
 * may already have running (see CLAUDE.md's dev-server-persistence rule).
 *
 * Checks, one assertion per spec row:
 * - The homepage row ("/") needs no map entry — falls through to the
 *   existing bare-path -> /fa redirect by design.
 * - The 2 rows Hamid explicitly kept blocked (جراحی برجستگی پیشانی,
 *   نمونه درمان) must have NO map entry — a silent regression here would
 *   mean an unreviewed article slipped through.
 * - Every other row must resolve to its expected destination — the
 *   spec's own `new_path`, UNLESS it's one of the 3 rows Hamid's
 *   2026-08-23 decisions overrode (بلفاروپلاستی, the fat-injection FAQ,
 *   /tag/متخصص-دندان-تبریز/) — those are checked against the approved
 *   override target instead of the original spec value.
 *
 * Plus a handful of host-canonicalization cases, including the critical
 * negative case (`localhost` must NEVER be rewritten to production).
 *
 * Also verifies every row of the separate Rank Math redirect audit
 * (rank-math-redirects/rank-math-redirects-merge-plan.csv, added
 * 2026-08-23): every `add-to-nextjs-redirect-map` row must resolve to its
 * `final_destination`, and the one `blocked-needs-manual-review` row
 * (sharing a destination with the still-blocked جراحی برجستگی پیشانی)
 * must have no map entry.
 *
 * Run: npm run verify:legacy-redirects
 */
import { readFileSync } from "node:fs";
import { resolveLegacyPath, resolveHostCanonicalization, normalizeLegacyPath } from "../src/middleware";
import { LEGACY_REDIRECTS } from "../src/content/legacy-redirects";

const SPEC_CSV = "docs/migration/sadighi-wordpress-seo-audit/implementation-spec/legacy-redirects-spec.csv";
const RANK_MATH_MERGE_CSV = "docs/migration/sadighi-wordpress-seo-audit/rank-math-redirects/rank-math-redirects-merge-plan.csv";

// Approved decisions (2026-08-23) that changed a spec row's destination —
// mirrors src/content/legacy-redirects.ts's own DECISION_OVERRIDES-equivalent
// (kept here independently, not imported, so this test doesn't just check
// the generator agrees with itself).
const DECISION_OVERRIDES: Record<string, string> = {
  "/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی": "/knowledge/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی",
  "/بلفاروپلاستی": "/knowledge/بلفاروپلاستی",
  "/tag/متخصص-دندان-تبریز": "/about",
};

/**
 * The spec/merge-plan CSVs still encode their `new_path`/`final_destination`
 * columns as `/fa/knowledge/...` etc. — written before the 2026-08-23 final
 * production URL restructuring made root the canonical Persian path (see
 * `src/i18n/locale-href.ts`'s own doc-comment). Mirrors
 * `generate_legacy_redirects_ts.py`'s `strip_fa_prefix` so this
 * verification checks the CURRENT architecture, not the CSVs' stale values,
 * without editing the CSVs themselves.
 */
function stripFaPrefix(path: string): string {
  if (path === "/fa") return "/";
  if (path.startsWith("/fa/")) return path.slice("/fa".length);
  return path;
}

// Hamid's explicit "keep blocked" instruction (2026-08-23) — must have NO map entry.
const STILL_BLOCKED = new Set(["/جراحی-برجستگی-پیشانی", "/نمونه-درمان"]);

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body
    .filter((r) => r.length > 1 || r[0] !== "")
    .map((r) => Object.fromEntries(header.map((h, i) => [h.replace(/^﻿/, ""), r[i] ?? ""])));
}

let failures = 0;
let passes = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passes++;
  } else {
    failures++;
    console.error(`FAIL  ${label}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
  }
}

function main() {
  const csvText = readFileSync(SPEC_CSV, "utf-8");
  const rows = parseCsv(csvText);
  console.log(`[verify-legacy-redirects] Loaded ${rows.length} spec rows from ${SPEC_CSV}`);

  for (const row of rows) {
    const oldPath = normalizeLegacyPath(row.old_path);

    if (oldPath === "/") {
      check(`homepage row falls through (no map entry)`, resolveLegacyPath("/"), null);
      continue;
    }

    if (STILL_BLOCKED.has(oldPath)) {
      check(`BLOCKED (kept out per decision 7): ${oldPath}`, resolveLegacyPath(oldPath), null);
      continue;
    }

    const expected = DECISION_OVERRIDES[oldPath] ?? (row.priority === "P0" ? stripFaPrefix(row.new_path) : null);
    check(`${oldPath} -> ${expected}`, resolveLegacyPath(oldPath), expected);
  }

  // Bonus historical-slug-variant entries (not in the 33-row spec, added
  // during implementation — see legacy-redirects.ts's own doc-comment).
  check(
    "bonus historical variant: لیفت-شقیقه-گلایدینگ؛...",
    resolveLegacyPath("/لیفت-شقیقه-گلایدینگ؛-جوانسازی-طبیعی-ب/"),
    "/knowledge/لیفت-شقیقه-گلایدینگ"
  );
  check(
    "bonus historical variant: جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود",
    resolveLegacyPath("/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود/"),
    "/knowledge/جراحی-فک-پایین-عقب-رفته"
  );

  // Rank Math redirect audit merge — see rank-math-redirects-summary.md.
  const rankMathText = readFileSync(RANK_MATH_MERGE_CSV, "utf-8");
  const rankMathRows = parseCsv(rankMathText);
  console.log(`[verify-legacy-redirects] Loaded ${rankMathRows.length} rank-math merge-plan rows from ${RANK_MATH_MERGE_CSV}`);
  for (const row of rankMathRows) {
    const oldPath = normalizeLegacyPath(row.source_decoded);
    if (row.merge_action === "add-to-nextjs-redirect-map") {
      const expected = stripFaPrefix(row.final_destination);
      check(`rank-math id ${row.id}: ${oldPath} -> ${expected}`, resolveLegacyPath(oldPath), expected);
    } else if (row.merge_action === "blocked-needs-manual-review") {
      check(`rank-math id ${row.id} BLOCKED: ${oldPath}`, resolveLegacyPath(oldPath), null);
    }
    // already-covered / out-of-scope-low-priority rows aren't asserted here —
    // "already-covered" is checked implicitly via the phase-1 spec/bonus
    // checks above (same source paths), and "out-of-scope" rows are
    // deliberately NOT in the map, nothing to assert against.
  }

  // Host/protocol canonicalization — including the critical negative case.
  check("www + http -> canonicalize", resolveHostCanonicalization({ hostname: "www.dralirezasadighi.com", protocol: "http:" }), true);
  check("apex + http -> canonicalize", resolveHostCanonicalization({ hostname: "dralirezasadighi.com", protocol: "http:" }), true);
  check("www + https -> canonicalize", resolveHostCanonicalization({ hostname: "www.dralirezasadighi.com", protocol: "https:" }), true);
  check("apex + https -> already canonical, no-op", resolveHostCanonicalization({ hostname: "dralirezasadighi.com", protocol: "https:" }), false);
  check("localhost -> NEVER touched (dev safety)", resolveHostCanonicalization({ hostname: "localhost", protocol: "http:" }), false);
  check("unrelated preview domain -> NEVER touched", resolveHostCanonicalization({ hostname: "smart-clinic-preview.vercel.app", protocol: "https:" }), false);

  const mapSize = Object.keys(LEGACY_REDIRECTS).length;
  console.log(`[verify-legacy-redirects] LEGACY_REDIRECTS has ${mapSize} entries.`);
  console.log(`[verify-legacy-redirects] ${passes} passed, ${failures} failed.`);

  if (failures > 0) {
    process.exit(1);
  }
}

main();
