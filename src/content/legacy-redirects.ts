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
 * 278 entries: 26 from the phase-1
 * P0-LAUNCH spec (legacy-redirects-spec.csv), 3 resolved by Hamid's
 * explicit decisions (2026-08-23) that were originally P0-blocked (the
 * بلفاروپلاستی collision, the fat-injection FAQ collision's Persian post,
 * and the /tag/متخصص-دندان-تبریز/ archive -> /about), 2 bonus
 * historical/renamed-permalink variants for articles already in this set
 * (from stage-2's unmatched-gsc-priority.csv), 10 merged in
 * from the Rank Math redirect audit (rank-math-redirects/rank-math-redirects-
 * merge-plan.csv) — Rank Math's own `destination` column pointed at OTHER
 * old WordPress URLs, not Next.js paths, so each of those 10 rows is a
 * 2-hop chain (rank-math source -> old WP page -> this map's existing
 * target) collapsed here into one direct rule — and 231
 * from the 2026-08-26 broad production audit (P0_BROAD_AUDIT_20260826
 * above), covering every OTHER legacy URL found 404ing on live production
 * with real GSC/WordPress traffic, not only the 5 originally-reported
 * examples (see production-redirect-audit.csv for the full audit).
 *
 * Both URLs once listed here as deliberately blocked pending a manual
 * content review and destination decision are now resolved:
 * /نمونه-درمان/ was unblocked 2026-08-26 (P0 production incident — this
 * URL 404ing with real search traffic — see P0_INCIDENT_FIXES_20260826
 * above and production-redirect-audit.csv for the full incident), and
 * /جراحی-برجستگی-پیشانی/ was unblocked 2026-08-28 (per Hamid, closing out
 * the last 2 remaining Search Console 404s) — see that entry below and
 * `scripts/verify-legacy-redirects.ts`'s DECISION_OVERRIDES for the
 * matching test-side change.
 *
 * /کامپوزیت-دندان؛-آشنایی-با-انواع،-مزای/ was similarly stuck on
 * "needs-human-decision" (no matching service, not migrated as a
 * standalone Knowledge Center article — see redirect-only-list.csv) until
 * the same 2026-08-28 round resolved it to the general /services page.
 *
 * Also excluded: the bare homepage path ("/") and the www/http host
 * variants — those are handled by separate host-canonicalization logic in
 * middleware.ts, not a path-to-path entry here. And 26 further Rank Math
 * rows classified `out-of-scope-low-priority` (destination is a WordPress
 * post not yet in any approved phase) or an English-locale alias — see the
 * merge plan for the full list, not repeated here.
 */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/25-سوال-متداول-در-مورد-تزریق-بوتاکس-برای": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/25-سوال-متداول-در-مورد-تزریق-فیلر-به-ناحی": "/knowledge/25-سوال-متداول-در-مورد-تزریق-فیلر-به-ناحی", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی": "/knowledge/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی", // decision override 2026-08-23
  "/25-سوال-متداول-در-مورد-جراحی-دندان-عقل-نه": "/knowledge/25-سوال-متداول-در-مورد-جراحی-دندان-عقل-نه", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-زیبایی-بین": "/knowledge/25-سوال-متداول-در-مورد-جراحی-زیبایی-بین", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-لیفت-ابرو-و-ش": "/knowledge/25-سوال-متداول-در-مورد-جراحی-لیفت-ابرو-و-ش", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-لیفت-صورت-که": "/knowledge/25-سوال-متداول-در-مورد-جراحی-لیفت-صورت-که", // Batch 2 Knowledge Center migration 2026-08-26
  "/25-سوال-متداول-در-مورد-جراحی-لیفت-صورت-که/photo_2024-07-15_20-57-10": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه": "/knowledge/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه", // phase-1 spec
  "/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه-2": "/knowledge/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه", // P0 broad audit 2026-08-26
  "/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/about-us": "/about", // phase-1 spec
  "/about-us/)": "/about", // P0 broad audit 2026-08-26
  "/appointment-form": "/contact", // P0 broad audit 2026-08-26
  "/best-dental-implant-specialist": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/best-rhinoplasty-surgeon-tabriz": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/blog": "/knowledge", // P0 broad audit 2026-08-26
  "/blog-en": "/en/knowledge", // P0 broad audit 2026-08-26
  "/blog/جراحی-دندان/ایمپلنت": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/blog/جراحی-دندان/ایمپلنت/دندانپزشک": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/blog/جراحی-دندان/جراحی-دندان-عقل": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/blog/جراحی-زیبایی/تزریق-چربی": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/blog/جراحی-زیبایی/جراحی-زیبایی-بینی": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/blog/جراحی-فک": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/blog/دسته-بندی-نشده/سینوس-لیفت": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/cas-چیست-و-کاربرد-های-آن": "/knowledge/جراحی-فک-دیجیتال", // Batch 2 Knowledge Center migration 2026-08-26
  "/comprehensive-guide-to-lower-jaw-surgery-everything-you-need-to-know": "/en/knowledge/recessed-lower-jaw-causes-symptoms-and-treatment", // Batch 2 Knowledge Center migration 2026-08-26
  "/contact/special-equipment-for-a-dentist-dentist-office": "/contact", // P0 broad audit 2026-08-26
  "/dall·e-2024-11-20-01-14-58-a-clean-and-visually-appealing-illustration-about-wisdom-teeth-showing-the-anatomy-of-the-jaw-and-the-position-of-wisdom-teeth-without-any-text-or-lo-2": "/about", // P0 broad audit 2026-08-26
  "/dall·e-2024-11-30-16-33-45-a-realistic-close-up-depiction-of-an-impacted-wisdom-tooth-causing-gum-swelling-and-discomfort-the-focus-is-on-a-detailed-dental-anatomy-with-the-su-2": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/digital-technology-in-corrective-facial-asymmetry-surgery": "/en/knowledge/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment", // Batch 2 Knowledge Center migration 2026-08-26
  "/en/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی": "/en/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/en/comprehensive-guide-to-lower-jaw-surgery-everything-you-need-to-know": "/en/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/en/dall·e-2024-11-20-01-14-58-a-clean-and-visually-appealing-illustration-about-wisdom-teeth-showing-the-anatomy-of-the-jaw-and-the-position-of-wisdom-teeth-without-any-text-or-lo-2": "/en/about", // P0 broad audit 2026-08-26
  "/en/digital-technology-in-corrective-facial-asymmetry-surgery": "/en/services/facial-reconstruction-surgery", // P0 broad audit 2026-08-26
  "/en/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment": "/en/services/facial-reconstruction-surgery", // P0 broad audit 2026-08-26
  "/en/lower-jaw-surgery-for-receding-jaw-improving-function-and-aesthetics": "/en/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/en/lower-jaw-surgery-for-receding-jaw-improving-function-and-aesthetics/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود": "/en/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/en/post-surgery-jaw-physiotherapy-a-comprehensive-guide-for-faster-recovery-with-effective-exercises": "/en/care-instructions/jaw-physiotherapy", // P0 broad audit 2026-08-26
  "/en/receding-jaw-surgery-recovery-and-long-term-results": "/en/care-instructions/jaw-surgery-care", // P0 broad audit 2026-08-26
  "/en/receding-jaw-surgery-recovery-and-long-term-results/جراحی-فک-پایین-عقب-رفته-2": "/en/care-instructions/jaw-surgery-care", // P0 broad audit 2026-08-26
  "/en/recessed-lower-jaw-causes-symptoms-and-treatment": "/en/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/en/sinos-lift-2": "/en/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/en/what-is-a-recessed-lower-jaw-causes-symptoms-and-the-importance-of-treatment": "/en/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/en/آیا-جراحی-فک-خطرناک-است؟-2": "/en/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/en/ایمپلنت-2-2": "/en/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/en/صفحه-اصلی/1-5-2": "/en", // P0 broad audit 2026-08-26
  "/en/صفحه-اصلی/doctor-holding-dentist-2": "/en", // P0 broad audit 2026-08-26
  "/en/صفحه-اصلی/downloadfile-42-2": "/en", // P0 broad audit 2026-08-26
  "/en/صفحه-اصلی/impalnet-2": "/en", // P0 broad audit 2026-08-26
  "/en/فک-تبریز-2": "/en/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/en/وفقیت-۱۳-واحد-ایمپلنت-پساز-دو-سال-بی-ه-2": "/en/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/european-nose-job": "/knowledge/european-nose-job", // phase-1 spec
  "/european-nose-job-what-is-it-and-who-is-it-for": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/eyebrow-gliding-lift": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment": "/en/knowledge/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment", // Batch 2 Knowledge Center migration 2026-08-26
  "/facial-rejuvenation-with-fillers-a-quick-and-effective-path-to-natural-beauty-in-tehran-and-tabriz": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/genioplasty-aftercare": "/care-instructions/genioplasty-care", // P0 broad audit 2026-08-26
  "/implant-cost-tabriz": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/installment-dental-implant": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/jaw-clicking-and-tmj-disorders-causes-treatments-and-solutions": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/lower-jaw-surgery-for-receding-jaw-improving-function-and-aesthetics": "/en/knowledge/recessed-lower-jaw-causes-symptoms-and-treatment", // Batch 2 Knowledge Center migration 2026-08-26
  "/optimal-timing-for-wisdom-tooth-surgery-jaw-surgery-and-dental-implants-during-orthodontic-treatment": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/post-surgery-jaw-physiotherapy-a-comprehensive-guide-for-faster-recovery-with-effective-exercises": "/care-instructions/jaw-physiotherapy", // P0 broad audit 2026-08-26
  "/receding-jaw-surgery-recovery-and-long-term-results": "/care-instructions/jaw-surgery-care", // P0 broad audit 2026-08-26
  "/recessed-lower-jaw-causes-symptoms-and-treatment": "/en/knowledge/recessed-lower-jaw-causes-symptoms-and-treatment", // Batch 2 Knowledge Center migration 2026-08-26
  "/recovery-period-of-chin-surgery-comparison-with-chin-implants-and-expertise-of-dr-alireza-sedighi": "/care-instructions/genioplasty-care", // P0 broad audit 2026-08-26
  "/sinos-lift-2": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/sinus-lift-care": "/care-instructions/sinus-lift-care", // P0 broad audit 2026-08-26
  "/sinus-lift-surgery-pre-post-care-guide": "/care-instructions/sinus-lift-care", // P0 broad audit 2026-08-26
  "/tag/جراحی-ایمپلنت-تبریز": "/services/advanced-dental-implant", // phase-1 spec
  "/tag/متخصص-دندان-تبریز": "/about", // decision override 2026-08-23
  "/treatment-of-facial-asymmetry-solutions-the-role-of-nuclear-medicine-scans-and-the-appropriate-age-for-jaw-surgery": "/en/knowledge/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment", // Batch 2 Knowledge Center migration 2026-08-26
  "/why-choose-dr-alireza-sedighi-for-jaw-surgery-a-top-choice-for-precision-and-excellence": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/آشنایی-با-انواع-عمل-جراحی-زیبایی-صورت": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/آیا-جراحی-فک-خطرناک-است؟": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/آیا-جراحی-فک-خطرناک-است؟/آیا-جراحی-فک-خطرناک-است؟": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/اموزش-دوره-ها-تخصصی-ایمپلنت": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/انواع-تزریق-چربی-میکروفت،-نانوفت-و-سای": "/knowledge/انواع-تزریق-چربی-میکروفت،-نانوفت-و-سای", // Batch 2 Knowledge Center migration 2026-08-26
  "/انواع-تزریق-چربی-میکروفت،-نانوفت-و-سای/charbi": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/انواع-روش-های-جراحی-چانه": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/انواع-روش-های-جراحی-چانه/untitled-3": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/ایمپلنت-اشترومن-در-تبریز": "/knowledge/ایمپلنت-اشترومن-در-تبریز", // phase-1 spec
  "/ایمپلنت-اشترومن-در-تبریز؛-بهترین-راه": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا": "/knowledge/ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا", // phase-1 spec
  "/ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا-صدیقی": "/services/advanced-dental-implant", // Search Console traffic URL, added 2026-09-01 — longer slug variant of the phase-1-spec entry above (same article, "-صدیقی" suffix), destination given directly by Hamid rather than the Knowledge Center article
  "/ایمپلنت-اقساطی-در-تهران": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-اقساطی-در-تهران-برای-همه؛-از-دغ": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-در-تهران": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-در-تهران-از-نگاه-بیماران؛-مقای": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-اقساطی": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-اقساطی-کاشت-دندان-با-ش": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-اقساطی-کاشت-دندان-با-ش/photo_2025-03-28_17-18-17": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-بدون-درد": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-بدون-درد-راهی-برای-لبخند": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-در-تبریز-پرسش-پاسخ": "/knowledge/ایمپلنت-دندان-در-تبریز-پرسش-پاسخ", // phase-1 spec
  "/ایمپلنت-دندان-در-تبریز؛-پرسشهای-پرتک": "/knowledge/ایمپلنت-دندان-در-تبریز-پرسش-پاسخ", // rank-math redirect id 24
  "/ایمپلنت-دندان-در-تعطیلات-عید-در-تبریز": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-قیمت-ایمپلنت-دندان": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-چیست": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دندان-چیست-و-چگونه-عمل-میکند": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دیجیتال": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-دیجیتال-تحولی-نوین-در-دندان": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-ساب-پریوستئال-دیجیتال": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-سوئیسی-دیجیتالی": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-سوئیسی-دیجیتالی؛-بهترین-راه": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-فوری-در-تبریز": "/knowledge/ایمپلنت-فوری-در-تبریز", // phase-1 spec
  "/ایمپلنت-فوری-در-تبریز-راهکاری-سریع-و-م": "/knowledge/ایمپلنت-فوری-در-تبریز", // rank-math redirect id 3
  "/ایمپلنت-فوری-در-تبریز-راهکاری-سریع-و-م/ایمپلنت-فوری-در-تبریز": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ایمپلنت-یک-روزه": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/بلفاروپلاستی": "/knowledge/بلفاروپلاستی", // decision override 2026-08-23
  "/بهترین-برندهای-ایمپلنت-دندانی-اشتروم": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/بهترین-تخصص-ایمپلنت-تبریز-و-معرفی-دکت": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/بهترین-جراح-فک-در-تبریز-راهنمای-مامل-ا": "/about", // P0 broad audit 2026-08-26
  "/بهترین-جراح-فک-در-تبریز-راهنمای-کامل-ا": "/about", // P0 broad audit 2026-08-26
  "/بهترین-جراح-فک-در-تبریز-راهنمای-کامل-ا/فک-تبریز": "/about", // P0 broad audit 2026-08-26
  "/بهترین-دندانپزشک-برای-ایمپلنت-دندان-د": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/بهترین-متخصص-ایملنت-ت�بریز-و-معرفی-دکت": "/about", // P0 broad audit 2026-08-26
  "/بهترین-متخصص-ایمپلنت-تبریز-و-معرفی-دکت": "/knowledge/بهترین-متخصص-ایمپلنت-تبریز-و-معرفی-دکت", // phase-1 spec
  "/بهترین-متخصص-ایپلنت-تبریز-و-معرفی-دکت": "/about", // P0 broad audit 2026-08-26
  "/بوتاکس": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/بوتاکس-برای-جوانسازی-پیشانی-و-دور-چشم-ر": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/بیماری-کندیلار-هایپرپلاژیا-علل،-تشخی": "/knowledge/بیماری-کندیلار-هایپرپلاژیا-علل،-تشخی", // Batch 2 Knowledge Center migration 2026-08-26
  "/تازه-های-فک-و-صورت": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/تزریق-بوتاکس-برای-از-بین-بردن-دندان-قرو": "/knowledge/تزریق-بوتاکس-برای-از-بین-بردن-دندان-قرو", // Batch 2 Knowledge Center migration 2026-08-26
  "/تزریق-بوتاکس-برای-از-بین-بردن-دندان-قرو/botox-injection-for": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/تزریق-فیلر": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/تفاوت-جراحی-دندان-عقل-با-کشیدن-ساده": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/تفاوت-جراحی-دندان-عقل-با-کشیدن-ساده/تفاوت-جراحی-دندان-عقل-با-کشیدن-ساده": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل": "/knowledge/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل", // phase-1 spec
  "/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل-هرآ": "/knowledge/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل", // rank-math redirect id 4
  "/توضیحاتی-در-مورد-ایمپلنت-دیجیتال": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/جراحی-ایمپلنت": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/جراحی-ایمپلنت-2": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/جراحی-بازسازی-نواقص-صورت-بازگرداندن": "/knowledge/ناقرینگیهای-ناشی-از-تروما-به-صورت-عل", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-برجستگی-پیشانی": "/services/facial-cosmetic-surgery", // unblocked 2026-08-28 (per Hamid, Search Console 404) — see this file's own top comment
  "/جراحی-بلفاروپلاستی": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-بینی": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/جراحی-بینی-به-سایت-اروپایی-زیبایی-و-تقا": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا": "/knowledge/جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا", // phase-1 spec
  "/جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا/photo_2024-07-29_12-16-45": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/جراحی-جلوآمدگی-فک-پایین": "/knowledge/جراحی-جلوآمدگی-فک-پایین-2", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-جلوآمدگی-فک-پایین-2": "/knowledge/جراحی-جلوآمدگی-فک-پایین-2", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-دندان-عقل": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/جراحی-دندان-عقل-با-بیهوشی-در-تبریز": "/knowledge/جراحی-دندان-عقل-با-بیهوشی-در-تبریز", // phase-1 spec
  "/جراحی-دندان-عقل-با-بیهوشی-در-تبریز/)": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/جراحی-دندان-عقل-با-بیهوشی-در-تبریز/جراحی-دندان-عقل-با-بیهوشی-در-تبریز": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/جراحی-دندان-عقل-در-تهران-و-تبریز-چرا-ان": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/جراحی-دیجیتال-فک": "/knowledge/جراحی-فک-دیجیتال", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-زیبایی-بینی": "/services/rhinoplasty", // P0 production incident fix 2026-08-26
  "/جراحی-زیبایی-بینی-راهنمای-کامل-عمل-بین": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/جراحی-سینوس-لیفت-چیست؟": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-2": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-ارتوگناتیک-مراحل-و-روند-درما": "/knowledge/جراحی-فک-ارتوگناتیک-مراحل-و-روند-درما", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-فک-به-روش-دیجیتال": "/knowledge/جراحی-فک-دیجیتال", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-فک-خطرناک": "/knowledge/جراحی-فک-خطرناک", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-فک-دیجیتال": "/knowledge/جراحی-فک-دیجیتال", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-فک-دیجیتال-انقلابی-در-دقت-و-نتایج": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-نی-نی-سایت": "/knowledge/جراحی-فک-نی-نی-سایت", // phase-1 spec
  "/جراحی-فک-نی-نی-سایت/جراحی-فک-نی-نی-سایت": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-و-دندان": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-و-مواردی-که-باید-بدانید": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-پایین-جلو-آمده": "/knowledge/جراحی-فک-پایین-جلو-آمده", // phase-1 spec
  "/جراحی-فک-پایین-عقب-رفته": "/knowledge/جراحی-فک-پایین-عقب-رفته", // phase-1 spec
  "/جراحی-فک-پایین-عقب-رفته-2": "/knowledge/جراحی-فک-پایین-عقب-رفته", // rank-math redirect id 9
  "/جراحی-فک-پایین-عقب-رفته-بهبودی-و-نتایج": "/knowledge/جراحی-فک-پایین-عقب-رفته", // rank-math redirect id 7
  "/جراحی-فک-پایین-عقب-رفته-بهبودی-و-نتایج/جراحی-فک-پایین-عقب-رفته": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود": "/knowledge/جراحی-فک-پایین-عقب-رفته", // historical slug variant, stage-2 unmatched-gsc-priority.csv
  "/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-چیست-و-چرا-انجام-میشود؟": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-فک-کم-تهاجمی": "/knowledge/جراحی-فک-کم-تهاجمی", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-فک-کمتهاجمی-روشی-نوین-برای-درم": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/جراحی-ناقرینگیهای-صورت-رویکردها-و-م": "/knowledge/ناقرینگیهای-ناشی-از-تروما-به-صورت-عل", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-ناقرینگیهای-صورت-رویکردها-و-م/برای-غیر-قرینگی": "/services/facial-reconstruction-surgery", // P0 broad audit 2026-08-26
  "/جراحی-چانه-پروتز-فیلر-جینیوپلاستی": "/knowledge/جراحی-چانه-پروتز-فیلر-جینیوپلاستی", // Batch 2 Knowledge Center migration 2026-08-26
  "/جراحی-چانه،-پروتز-چانه،-فیلر-و-جینیوپل": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/جوانسازی-صورت-با-فیلر-تهران-و-تبریز": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/جوانسازی-صورت-با-فیلر-راهی-سریع-و-مؤثر": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/خدمات": "/services", // P0 broad audit 2026-08-26
  "/خدمات-زیبایی": "/services", // P0 production incident fix 2026-08-26
  "/خدمات-ما": "/services", // P0 broad audit 2026-08-26
  "/درد-دندان-عقل": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/درمان-غیر-قرینگی-صورت-راهکارها،-نقش-اس": "/knowledge/ناقرینگیهای-ناشی-از-تروما-به-صورت-عل", // Batch 2 Knowledge Center migration 2026-08-26
  "/دوره-نقاهت-جراحی-چانه،-مقایسه-با-پروتز": "/care-instructions/genioplasty-care", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی-2": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/23-2": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/attachment/23": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/bini": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/bini-2": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/cas": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/cosmetic-surgery": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/downloadfile-52": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/dr-sadighi": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/goz-kapagi-estetigi": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/impalnet": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/n17_60_11zon": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/n3_52_11zon": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/n7_54_11zon": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/rezayat1_64_11zon": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/لیفت-ابرو_5": "/about", // P0 broad audit 2026-08-26
  "/دکتر-علیرضا-صدیقی/لیفت-صورت-2": "/about", // P0 broad audit 2026-08-26
  "/راهنمای-جامع-ایمپلنت-دندان-در-تبریز": "/knowledge/راهنمای-جامع-ایمپلنت-دندان-در-تبریز", // Batch 2 Knowledge Center migration 2026-08-26
  "/راهنمای-جامع-ایمپلنت-دندان-در-تبریز-2": "/knowledge/راهنمای-جامع-ایمپلنت-دندان-در-تبریز", // Batch 2 Knowledge Center migration 2026-08-26
  "/راهنمای-جامع-ایمپلنت-دندان-در-تبریز-مع": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/راهنمای-جامع-جراحی-فک-پایین-جلو-آمده-هر": "/knowledge/جراحی-فک-پایین-جلو-آمده", // rank-math redirect id 19
  "/راهنمای-جامع-جراحی-فک-پایین-جلو-آمده-هر/راهنمای-جامع-جراحی-فک-پایین-جلو-آمده-هر": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/راهنمای-جامع-کاشت-دندان-و-ایمپلنت-در-تب": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/رضایت-بیمار-از-جراحی-بینی": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/رضایت-بیمار-از-جراحی-فک": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/رضایت-بیمار-از-جراحی-فک-بالا-و-پایین": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/رضایت-بیمار-از-جراحی-فک/vid-47641124-002718-228-1": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/رضایت-بیمار-پس-از-جراحی-بلفاروپلاستی": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/روشهای-نوین-جراحی-برای-اصلاح-جلوآمدگ": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/روند-درمانی-و-ترتیب-درمانی-جراحی-فک،-ای": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/ریلپس-یا-بازگشت-پس-از-عمل-جراحی-فک-با-تا": "/knowledge/ریلپس-یا-بازگشت-پس-از-عمل-جراحی-فک-با-تا", // phase-1 spec
  "/رینوپلاستی-بینی-گوشتی": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/رینوپلاستی-چیست؟": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/زیبایی-بینی": "/services/rhinoplasty", // P0 production incident fix 2026-08-26
  "/سوالات-متداول-ایمپلنت": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/سوالات-متداول-بلفاروپلاستی": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/سینوس-لیفت-تخصصی-و-کاشت-ایمپلنت-دندان-ب": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/سینوس-لیفت-و-ایمپلنت-دندان": "/knowledge/سینوس-لیفت-و-ایمپلنت-دندان", // Batch 2 Knowledge Center migration 2026-08-26
  "/سینوس-لیفت-چیست؟": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/شکاف-لب-و-کام-چیست؟": "/services/facial-reconstruction-surgery", // P0 broad audit 2026-08-26
  "/شکاف-لب-و-کام-چیست؟/d067f6de43bb2ff994f11414142d60ab-cleft-lip-palate": "/services/facial-reconstruction-surgery", // P0 broad audit 2026-08-26
  "/صدای-فک-و-اختلالات-مفصل-tmj-علل،-راهکارها": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/صفحه-اصلی": "/", // P0 broad audit 2026-08-26
  "/صفحه-اصلی/23-3": "/", // P0 broad audit 2026-08-26
  "/صفحه-اصلی/234-2": "/", // P0 broad audit 2026-08-26
  "/طول-عمر-ایمپلنت-دندان": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/طول-عمر-ایمپلنت-دندان-چقدر-است؟-بررسی-ج": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/عمل-بینی-اروپایی-چیست-و-برای-چه-چهرهه": "/knowledge/european-nose-job", // rank-math redirect id 35
  "/عوارض-ایمپلنت-دندان": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/عوارض-ایمپلنت-دندان-واقعیت-یا-نگرانی-ب": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/فک-پایین-عقبرفته": "/knowledge/فک-پایین-عقبرفته", // Batch 2 Knowledge Center migration 2026-08-26
  "/فک-پایین-عقبرفته-چیست؟-دلایل،-علائم": "/services/orthognathic-surgery", // P0 broad audit 2026-08-26
  "/فیزیوتراپی-بعد-از-جراحی-فک": "/knowledge/فیزیوتراپی-بعد-از-جراحی-فک", // phase-1 spec
  "/فیزیوتراپی-بعد-از-جراحی-فک-راقنمای-کام": "/care-instructions/jaw-physiotherapy", // P0 broad audit 2026-08-26
  "/فیزیوتراپی-بعد-از-جراحی-فک-راهنمای-کام": "/knowledge/فیزیوتراپی-بعد-از-جراحی-فک-راهنمای-کام", // phase-1 spec
  "/فیزیوتراپی-بعد-از-جراحی-فک-چرا-ضروری-اس": "/knowledge/فیزیوتراپی-بعد-از-جراحی-فک", // rank-math redirect id 21
  "/فیلم-جراحی-فک-در-اتاق-عمل": "/knowledge/فیلم_جراحی_فک_در_اتاق_عمل", // rank-math redirect id 11
  "/فیلم_جراحی_فک_در_اتاق_عمل": "/knowledge/فیلم_جراحی_فک_در_اتاق_عمل", // phase-1 spec
  "/کامپوزیت-دندان؛-آشنایی-با-انواع،-مزای": "/services", // resolved 2026-08-28 (per Hamid, Search Console 404) — no matching service page, general dentistry with no Knowledge Center article
  "/لیفت-ابرو-و-شقیقه": "/knowledge/لیفت-ابرو-و-شقیقه", // phase-1 spec
  "/لیفت-ابرو-وشقیقه": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/لیفت-شقیقه-گلایدینگ": "/knowledge/لیفت-شقیقه-گلایدینگ", // phase-1 spec
  "/لیفت-شقیقه-گلایدینگ؛-جوانسازی-طبیعی-ب": "/knowledge/لیفت-شقیقه-گلایدینگ", // historical slug variant, stage-2 unmatched-gsc-priority.csv
  "/لیفت-صورت": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/لیپوساکشن-و-تزریق-چربی-روشهای-نوین-ج": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/مراحل-جراحی-فک-در-اتاق-عمل-از-برنامهر": "/knowledge/فیلم_جراحی_فک_در_اتاق_عمل", // rank-math redirect id 11
  "/مراقبت-بعد-از-جراحی-دندان-عقل": "/care-instructions/wisdom-tooth-care", // P0 broad audit 2026-08-26
  "/مراقبت-بینی": "/care-instructions/rhinoplasty-care", // P0 broad audit 2026-08-26
  "/مراقبت-جراحی-بلفاروپلاستی-ابرو": "/care-instructions/blepharoplasty-care", // P0 broad audit 2026-08-26
  "/مراقبت-جراحی-بینی": "/care-instructions/rhinoplasty-care", // P0 broad audit 2026-08-26
  "/مراقبت-جراحی-فک": "/care-instructions/jaw-surgery-care", // P0 broad audit 2026-08-26
  "/مراقبت-های-بعد-از-عمل/مراقبت-بعد-از-جراحی-دندان-عقل": "/care-instructions/wisdom-tooth-care", // P0 broad audit 2026-08-26
  "/مراقبت-های-بعد-از-عمل/مراقبتهای-جراحی-لیفت": "/care-instructions/facelift-browlift-care", // P0 broad audit 2026-08-26
  "/مراقبت-های-جراحی-ایمپلنت": "/care-instructions/implant-care", // P0 broad audit 2026-08-26
  "/مراقبتهای-قبل-از-عمل-لیفت": "/care-instructions/facelift-browlift-care", // P0 broad audit 2026-08-26
  "/مراقبتهای-قبل-و-بعد-از-جراحی-سینوس-لی": "/care-instructions/sinus-lift-care", // P0 broad audit 2026-08-26
  "/مزایای-جراحی-فک-و-معرفی-بهترین-جراح-فک،": "/about", // P0 broad audit 2026-08-26
  "/مقالات": "/knowledge", // P0 broad audit 2026-08-26
  "/مقالات-2": "/knowledge", // P0 broad audit 2026-08-26
  "/مقایسه-ایمپلنت-و-دندان-طبیعی-بررسی-تفا": "/knowledge/مقایسه-ایمپلنت-و-دندان-طبیعی-بررسی-تفا", // Batch 2 Knowledge Center migration 2026-08-26
  "/موفقیت-۱۳-واحد-ایمپلنت-پساز-دو-سال-بی": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/ناقرینگیهای-ناشی-از-تروما-به-صورت-عل": "/knowledge/ناقرینگیهای-ناشی-از-تروما-به-صورت-عل", // Batch 2 Knowledge Center migration 2026-08-26
  "/نمونه-درمان": "/before-after", // P0 production incident fix 2026-08-26
  "/نمونه-درمان/n13": "/before-after", // P0 broad audit 2026-08-26
  "/نمونه-درمان/n27": "/before-after", // P0 broad audit 2026-08-26
  "/نمونه-درمان/n36": "/before-after", // P0 broad audit 2026-08-26
  "/همه-آنچه-باید-در-مورد-ایمپلنت-دندان-بدا": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/همه-چیز-در-مورد-دندان-عقل": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/همه-چیز-در-مورد-رینوپلاستی": "/services/rhinoplasty", // P0 broad audit 2026-08-26
  "/همهچیز-درباره-دندان-عقل-زمان-مناسب-ب": "/knowledge/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل", // P0 broad audit 2026-08-26
  "/همهچیز-درباره-دندان-عقل-زمان-مناسب-ب/dall·e-2024-11-20-01-14-58-a-clean-and-visually-appealing-illustration-about-wisdom-teeth-showing-the-anatomy-of-the-jaw-and-the-position-of-wisdom-teeth-without-any-text-or-lo": "/about", // P0 broad audit 2026-08-26
  "/پروتز-گونه": "/services/facial-cosmetic-surgery", // P0 broad audit 2026-08-26
  "/پیوند-استخوان-برای-ایمپلنتهای-دندان": "/services/advanced-dental-implant", // P0 broad audit 2026-08-26
  "/چرا-دندان-عقل-درد-میکند؟-دلایل-و-راه": "/services/impacted-tooth-surgery", // P0 broad audit 2026-08-26
  "/چرا-دکتر-علیرضا-صدیقی-را-برای-جراحی-فک-ا": "/about", // P0 broad audit 2026-08-26
};
