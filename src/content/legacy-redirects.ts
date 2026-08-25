/**
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
 * 41 entries: 26 from the phase-1
 * P0-LAUNCH spec (legacy-redirects-spec.csv), 3 resolved by Hamid's
 * explicit decisions (2026-08-23) that were originally P0-blocked (the
 * بلفاروپلاستی collision, the fat-injection FAQ collision's Persian post,
 * and the /tag/متخصص-دندان-تبریز/ archive -> /about), 2 bonus
 * historical/renamed-permalink variants for articles already in this set
 * (from stage-2's unmatched-gsc-priority.csv), and 10 merged in
 * from the Rank Math redirect audit (rank-math-redirects/rank-math-redirects-
 * merge-plan.csv) — Rank Math's own `destination` column pointed at OTHER
 * old WordPress URLs, not Next.js paths, so each of those 10 rows is a
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
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/25-سوال-متداول-در-مورد-تزریق-فیلر-به-ناحی": "/knowledge/25-سوال-متداول-در-مورد-تزریق-فیلر-به-ناحی", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی": "/knowledge/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی", // decision override 2026-08-23
  "/25-سوال-متداول-در-مورد-جراحی-دندان-عقل-نه": "/knowledge/25-سوال-متداول-در-مورد-جراحی-دندان-عقل-نه", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-زیبایی-بین": "/knowledge/25-سوال-متداول-در-مورد-جراحی-زیبایی-بین", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-لیفت-ابرو-و-ش": "/knowledge/25-سوال-متداول-در-مورد-جراحی-لیفت-ابرو-و-ش", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه": "/knowledge/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه", // phase-1 spec
  "/about-us": "/about", // phase-1 spec
  "/contact": "/contact", // phase-1 spec
  "/european-nose-job": "/knowledge/european-nose-job", // phase-1 spec
  "/tag/جراحی-ایمپلنت-تبریز": "/services/advanced-dental-implant", // phase-1 spec
  "/tag/متخصص-دندان-تبریز": "/about", // decision override 2026-08-23
  "/ایمپلنت-اشترومن-در-تبریز": "/knowledge/ایمپلنت-اشترومن-در-تبریز", // phase-1 spec
  "/ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا": "/knowledge/ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا", // phase-1 spec
  "/ایمپلنت-دندان-در-تبریز-پرسش-پاسخ": "/knowledge/ایمپلنت-دندان-در-تبریز-پرسش-پاسخ", // phase-1 spec
  "/ایمپلنت-دندان-در-تبریز؛-پرسشهای-پرتک": "/knowledge/ایمپلنت-دندان-در-تبریز-پرسش-پاسخ", // rank-math redirect id 24
  "/ایمپلنت-فوری-در-تبریز": "/knowledge/ایمپلنت-فوری-در-تبریز", // phase-1 spec
  "/ایمپلنت-فوری-در-تبریز-راهکاری-سریع-و-م": "/knowledge/ایمپلنت-فوری-در-تبریز", // rank-math redirect id 3
  "/بلفاروپلاستی": "/knowledge/بلفاروپلاستی", // decision override 2026-08-23
  "/بهترین-متخصص-ایمپلنت-تبریز-و-معرفی-دکت": "/knowledge/بهترین-متخصص-ایمپلنت-تبریز-و-معرفی-دکت", // phase-1 spec
  "/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل": "/knowledge/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل", // phase-1 spec
  "/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل-هرآ": "/knowledge/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل", // rank-math redirect id 4
  "/جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا": "/knowledge/جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا", // phase-1 spec
  "/جراحی-دندان-عقل-با-بیهوشی-در-تبریز": "/knowledge/جراحی-دندان-عقل-با-بیهوشی-در-تبریز", // phase-1 spec
  "/جراحی-فک-نی-نی-سایت": "/knowledge/جراحی-فک-نی-نی-سایت", // phase-1 spec
  "/جراحی-فک-پایین-جلو-آمده": "/knowledge/جراحی-فک-پایین-جلو-آمده", // phase-1 spec
  "/جراحی-فک-پایین-عقب-رفته": "/knowledge/جراحی-فک-پایین-عقب-رفته", // phase-1 spec
  "/جراحی-فک-پایین-عقب-رفته-2": "/knowledge/جراحی-فک-پایین-عقب-رفته", // rank-math redirect id 9
  "/جراحی-فک-پایین-عقب-رفته-بهبودی-و-نتایج": "/knowledge/جراحی-فک-پایین-عقب-رفته", // rank-math redirect id 7
  "/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود": "/knowledge/جراحی-فک-پایین-عقب-رفته", // historical slug variant, stage-2 unmatched-gsc-priority.csv
  "/راهنمای-جامع-جراحی-فک-پایین-جلو-آمده-هر": "/knowledge/جراحی-فک-پایین-جلو-آمده", // rank-math redirect id 19
  "/ریلپس-یا-بازگشت-پس-از-عمل-جراحی-فک-با-تا": "/knowledge/ریلپس-یا-بازگشت-پس-از-عمل-جراحی-فک-با-تا", // phase-1 spec
  "/عمل-بینی-اروپایی-چیست-و-برای-چه-چهرهه": "/knowledge/european-nose-job", // rank-math redirect id 35
  "/فیزیوتراپی-بعد-از-جراحی-فک": "/knowledge/فیزیوتراپی-بعد-از-جراحی-فک", // phase-1 spec
  "/فیزیوتراپی-بعد-از-جراحی-فک-راهنمای-کام": "/knowledge/فیزیوتراپی-بعد-از-جراحی-فک-راهنمای-کام", // phase-1 spec
  "/فیزیوتراپی-بعد-از-جراحی-فک-چرا-ضروری-اس": "/knowledge/فیزیوتراپی-بعد-از-جراحی-فک", // rank-math redirect id 21
  "/فیلم-جراحی-فک-در-اتاق-عمل": "/knowledge/فیلم_جراحی_فک_در_اتاق_عمل", // rank-math redirect id 11
  "/فیلم_جراحی_فک_در_اتاق_عمل": "/knowledge/فیلم_جراحی_فک_در_اتاق_عمل", // phase-1 spec
  "/لیفت-ابرو-و-شقیقه": "/knowledge/لیفت-ابرو-و-شقیقه", // phase-1 spec
  "/لیفت-شقیقه-گلایدینگ": "/knowledge/لیفت-شقیقه-گلایدینگ", // phase-1 spec
  "/لیفت-شقیقه-گلایدینگ؛-جوانسازی-طبیعی-ب": "/knowledge/لیفت-شقیقه-گلایدینگ", // historical slug variant, stage-2 unmatched-gsc-priority.csv
  "/مراحل-جراحی-فک-در-اتاق-عمل-از-برنامهر": "/knowledge/فیلم_جراحی_فک_در_اتاق_عمل", // rank-math redirect id 11
};
