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
import { resolveLegacyPath, resolveHostCanonicalization, normalizeLegacyPath, stripNonInternalFaPrefix } from "../src/middleware";
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
  // P0 production incident (2026-08-26) — reverses the earlier "keep
  // blocked" decision for this one URL specifically; see STILL_BLOCKED
  // below and production-redirect-audit.csv for the full incident.
  "/نمونه-درمان": "/before-after",
  // Unblocked 2026-08-28 (per Hamid, closing out the last 2 remaining
  // Search Console 404s) — reverses the earlier "keep blocked" decision;
  // see STILL_BLOCKED below and legacy-redirects.ts's own top comment.
  "/جراحی-برجستگی-پیشانی": "/services/facial-cosmetic-surgery",
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

// Hamid's explicit "keep blocked" instruction (2026-08-23) — must have NO
// map entry. نمونه-درمان REMOVED 2026-08-26 (P0 incident, see
// DECISION_OVERRIDES above); جراحی-برجستگی-پیشانی REMOVED 2026-08-28 (per
// Hamid, closing out the last 2 remaining Search Console 404s — see
// DECISION_OVERRIDES above). Empty for now — kept as a Set (not deleted)
// since it's the established mechanism for any future "keep blocked"
// decision.
const STILL_BLOCKED = new Set<string>([]);

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

    if (oldPath === "/contact") {
      // P0 production incident (2026-08-26): the spec's own new_path for
      // this row (/fa/contact) strips to /contact — identical to the old
      // path — which is exactly the self-redirect bug that looped
      // production. resolveLegacyPath's self-redirect guard makes this
      // null on purpose; see the REGRESSION check below for the full story.
      check(`${oldPath} falls through (self-redirect guard, not a map entry)`, resolveLegacyPath(oldPath), null);
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

  // P0 production incident (2026-08-26) — see production-redirect-audit.csv.
  // Critical regression test: this exact bug (a bad LEGACY_REDIRECTS row
  // whose target equalled its own source) caused an infinite self-redirect
  // on live production. resolveLegacyPath must return null for /contact —
  // meaning "no legacy redirect," so the request falls through to the real
  // page — not a redirect back to itself.
  check("REGRESSION: /contact must NOT self-redirect", resolveLegacyPath("/contact"), null);

  // The 3 P0 fixes that don't exist as legacy-redirects-spec.csv rows at
  // all (so the main spec-row loop above never exercises them) — injected
  // directly via P0_INCIDENT_FIXES_20260826 in the generator.
  check("P0 fix: /جراحی-زیبایی-بینی/", resolveLegacyPath("/جراحی-زیبایی-بینی/"), "/services/rhinoplasty");
  check("P0 fix: /زیبایی-بینی/", resolveLegacyPath("/زیبایی-بینی/"), "/services/rhinoplasty");
  check("P0 fix: /خدمات-زیبایی/", resolveLegacyPath("/خدمات-زیبایی/"), "/services");

  // No LEGACY_REDIRECTS target may ever be a /fa/... path — Persian
  // canonical targets are always root paths (src/i18n/locale-href.ts).
  for (const [source, target] of Object.entries(LEGACY_REDIRECTS)) {
    check(`no /fa target: ${source} -> ${target}`, target === "/fa" || target.startsWith("/fa/"), false);
  }

  // Every entry actually in the generated map resolves to itself through
  // resolveLegacyPath — catches any future drift between the map's own
  // data and the function that reads it (normalization bugs, stale
  // rebuilds), independent of the CSV-derived spot-checks above.
  for (const [source, target] of Object.entries(LEGACY_REDIRECTS)) {
    check(`map entry resolves: ${source}`, resolveLegacyPath(source), target);
  }

  // /fa (bare, no further path) must still collapse to root Persian, not
  // stay /fa or become /fa/internal-guarded — internal/* is the one
  // carve-out stripNonInternalFaPrefix itself makes (returns null there).
  check("/fa -> / (bare)", stripNonInternalFaPrefix("/fa"), "/");
  check("/fa/about -> /about", stripNonInternalFaPrefix("/fa/about"), "/about");
  check("/fa/internal/... untouched (returns null)", stripNonInternalFaPrefix("/fa/internal/dashboard"), null);

  // Top 30 highest-click legacy URLs (search-console-url-performance.csv,
  // cross-referenced against wordpress-content-inventory.csv/migration-map-
  // draft.csv during the 2026-08-26 P0 audit) — each must resolve to a real
  // redirect target, UNLESS it's one of the two rows Hamid keeps
  // deliberately blocked (STILL_BLOCKED) or a path the new site already
  // serves natively (no redirect needed at all).
  const NATIVE_NO_REDIRECT_NEEDED = new Set(["/contact"]);
  const TOP_CLICK_LEGACY_URLS: readonly string[] = [
    "/ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا",
    "/جراحی-فک-نی-نی-سایت",
    "/جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا",
    "/جراحی-دندان-عقل-با-بیهوشی-در-تبریز",
    "/فیزیوتراپی-بعد-از-جراحی-فک-راهنمای-کام",
    "/tag/متخصص-دندان-تبریز",
    "/فیلم_جراحی_فک_در_اتاق_عمل",
    "/25-سوال-متداول-در-مورد-جراحی-لیفت-ابرو-و-ش",
    "/tag/جراحی-ایمپلنت-تبریز",
    "/بهترین-متخصص-ایمپلنت-تبریز-و-معرفی-دکت",
    "/contact",
    "/ایمپلنت-فوری-در-تبریز",
    "/about-us",
    "/ریلپس-یا-بازگشت-پس-از-عمل-جراحی-فک-با-تا",
    "/25-سوال-متداول-در-مورد-جراحی-دندان-عقل-نه",
    "/لیفت-شقیقه-گلایدینگ",
    "/european-nose-job",
    "/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی",
    "/25-سوال-متداول-در-مورد-تزریق-فیلر-به-ناحی",
    "/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل",
    "/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه",
    "/جراحی-برجستگی-پیشانی",
    "/فیزیوتراپی-بعد-از-جراحی-فک",
    "/لیفت-ابرو-و-شقیقه",
    "/جراحی-فک-پایین-عقب-رفته",
    "/جراحی-فک-پایین-جلو-آمده",
    "/نمونه-درمان",
    "/ایمپلنت-دندان-در-تبریز-پرسش-پاسخ",
    "/ایمپلنت-اشترومن-در-تبریز",
    "/25-سوال-متداول-در-مورد-جراحی-زیبایی-بین",
  ];
  for (const path of TOP_CLICK_LEGACY_URLS) {
    const normalized = normalizeLegacyPath(path);
    if (STILL_BLOCKED.has(normalized) || NATIVE_NO_REDIRECT_NEEDED.has(normalized)) {
      continue; // asserted elsewhere (BLOCKED loop above / the /contact regression check)
    }
    const target = resolveLegacyPath(path);
    check(`top-click URL has a redirect: ${path}`, target !== null, true);
  }

  // Batch 2 Knowledge Center migration (2026-08-26) — the 15 approved
  // final articles, including the consolidation clusters (multiple old WP
  // permalinks -> one final article) and the two real-English-translation
  // redirects, which must land on /en/knowledge/..., never the bare
  // Persian route.
  check("Batch 2: digital jaw surgery primary", resolveLegacyPath("/جراحی-فک-دیجیتال"), "/knowledge/جراحی-فک-دیجیتال");
  check("Batch 2: digital jaw surgery duplicate 1", resolveLegacyPath("/جراحی-دیجیتال-فک"), "/knowledge/جراحی-فک-دیجیتال");
  check("Batch 2: digital jaw surgery duplicate 2", resolveLegacyPath("/جراحی-فک-به-روش-دیجیتال"), "/knowledge/جراحی-فک-دیجیتال");
  check("Batch 2: CAS duplicate folds into digital jaw surgery", resolveLegacyPath("/cas-چیست-و-کاربرد-های-آن"), "/knowledge/جراحی-فک-دیجیتال");
  check("Batch 2: facial asymmetry primary", resolveLegacyPath("/ناقرینگیهای-ناشی-از-تروما-به-صورت-عل"), "/knowledge/ناقرینگیهای-ناشی-از-تروما-به-صورت-عل");
  check("Batch 2: facial asymmetry EN translation redirects to /en/knowledge, not bare", resolveLegacyPath("/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment"), "/en/knowledge/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment");
  check("Batch 2: facial asymmetry EN duplicate also -> EN translation route", resolveLegacyPath("/treatment-of-facial-asymmetry-solutions-the-role-of-nuclear-medicine-scans-and-the-appropriate-age-for-jaw-surgery"), "/en/knowledge/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment");
  check("Batch 2: recessed lower jaw primary", resolveLegacyPath("/فک-پایین-عقبرفته"), "/knowledge/فک-پایین-عقبرفته");
  check("Batch 2: recessed lower jaw EN translation redirects to /en/knowledge, not bare", resolveLegacyPath("/recessed-lower-jaw-causes-symptoms-and-treatment"), "/en/knowledge/recessed-lower-jaw-causes-symptoms-and-treatment");
  check("Batch 2: protruding lower jaw primary (-2 variant)", resolveLegacyPath("/جراحی-جلوآمدگی-فک-پایین-2"), "/knowledge/جراحی-جلوآمدگی-فک-پایین-2");
  check("Batch 2: protruding lower jaw base duplicate", resolveLegacyPath("/جراحی-جلوآمدگی-فک-پایین"), "/knowledge/جراحی-جلوآمدگی-فک-پایین-2");
  check("Batch 2: implant guide primary", resolveLegacyPath("/راهنمای-جامع-ایمپلنت-دندان-در-تبریز"), "/knowledge/راهنمای-جامع-ایمپلنت-دندان-در-تبریز");
  check("Batch 2: implant guide -2 duplicate", resolveLegacyPath("/راهنمای-جامع-ایمپلنت-دندان-در-تبریز-2"), "/knowledge/راهنمای-جامع-ایمپلنت-دندان-در-تبریز");
  check("Batch 2: facial lift FAQ (standalone)", resolveLegacyPath("/25-سوال-متداول-در-مورد-جراحی-لیفت-صورت-که"), "/knowledge/25-سوال-متداول-در-مورد-جراحی-لیفت-صورت-که");
  check("Batch 2: botox for bruxism (standalone)", resolveLegacyPath("/تزریق-بوتاکس-برای-از-بین-بردن-دندان-قرو"), "/knowledge/تزریق-بوتاکس-برای-از-بین-بردن-دندان-قرو");
  check("Batch 2: is jaw surgery dangerous (standalone)", resolveLegacyPath("/جراحی-فک-خطرناک"), "/knowledge/جراحی-فک-خطرناک");
  check("Batch 2: condylar hyperplasia (standalone)", resolveLegacyPath("/بیماری-کندیلار-هایپرپلاژیا-علل،-تشخی"), "/knowledge/بیماری-کندیلار-هایپرپلاژیا-علل،-تشخی");
  check("Batch 2: orthognathic surgery stages (standalone)", resolveLegacyPath("/جراحی-فک-ارتوگناتیک-مراحل-و-روند-درما"), "/knowledge/جراحی-فک-ارتوگناتیک-مراحل-و-روند-درما");

  // Known redirect issue fix (approved, 2026-08-26): must never point at
  // /about again — the mis-redirect this exact check guards against.
  check("FIX: wisdom-tooth-timing mis-redirect no longer points at /about", resolveLegacyPath("/همهچیز-درباره-دندان-عقل-زمان-مناسب-ب"), "/knowledge/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل");

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
