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
# نمونه-درمان REMOVED 2026-08-26 (P0 production incident): Hamid's newer,
# more specific instruction explicitly reverses the 2026-08-23 "keep
# blocked" decision for this one URL, redirecting it to /before-after
# instead (67 clicks / 3337 impressions per search-console-url-
# performance.csv — real traffic that was 404ing on live production). A
# later explicit instruction on the same exact URL from the same person
# supersedes the earlier one; flagged in production-redirect-audit.csv
# rather than silently carried forward. جراحی-برجستگی-پیشانی was not
# mentioned in that newer instruction and stays blocked, unchanged.
STILL_BLOCKED = {"/جراحی-برجستگی-پیشانی"}

# Historical/renamed permalink variants surfaced in stage-2's
# unmatched-gsc-priority.csv, pointing at articles already in this phase's
# approved set — bonus protection, not in the original 33-row spec.
EXTRA_HISTORICAL_VARIANTS = {
    "/لیفت-شقیقه-گلایدینگ؛-جوانسازی-طبیعی-ب": "/fa/knowledge/لیفت-شقیقه-گلایدینگ",
    "/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود": "/fa/knowledge/جراحی-فک-پایین-عقب-رفته",
}

# P0 production incident (2026-08-26): these 4 URLs were 404ing on live
# production. None of the latter 3 exist as rows in legacy-redirects-
# spec.csv at all (so DECISION_OVERRIDES, which only applies to existing
# spec rows, can't reach them) — injected directly here instead, same
# mechanism as EXTRA_HISTORICAL_VARIANTS above. See
# production-redirect-audit.csv for the full audit this round produced.
P0_INCIDENT_FIXES_20260826 = {
    # Real WordPress page, 67 clicks / 3337 impressions (search-console-
    # url-performance.csv) — reverses the earlier "keep blocked" decision,
    # see the STILL_BLOCKED comment above.
    "/نمونه-درمان": "/fa/before-after",
    # Real WordPress post ("جراحی زیبایی بینی | راهنمای کامل عمل بینی
    # طبیعی با بهترین نتایج"), 7 clicks / 312 impressions. migration-map-
    # draft.csv had originally planned this as its OWN Knowledge Center
    # article (proposed /fa/knowledge/جراحی-زیبایی-بینی) but it was never
    # actually written in the phase-1 migration (not among the 25 articles
    # in content/knowledge-articles.ts) — the rhinoplasty SERVICE page is
    # the closest EXISTING page, not an invented one. Update this target
    # if/when that article is ever written.
    "/جراحی-زیبایی-بینی": "/fa/services/rhinoplasty",
    # Real WordPress page ("زیبایی بینی"), 23 clicks / 13,993 impressions —
    # by far the highest-impression URL in this whole incident. Same
    # situation as above: migration-map-draft.csv planned a dedicated
    # article (/fa/knowledge/زیبایی-بینی) that was never written. Flagging
    # this one as the single highest-value follow-up in the final report.
    "/زیبایی-بینی": "/fa/services/rhinoplasty",
    # Real WordPress page ("خدمات زیبایی"), 16 clicks / 5446 impressions.
    # migration-map-draft.csv flagged this "needs-manual-review" — topic
    # unclear from title/categories/slug — so the generic services index
    # is the safest fallback, not a guessed specific service.
    "/خدمات-زیبایی": "/fa/services",
}


# Broad production audit (2026-08-26), task 4: "complete redirect map for
# all important legacy URLs", not only the 5 originally-reported examples.
# Built from a systematic pass over all 532 URLs collected from WordPress/
# GSC/RankMath/migration-map sources (docs/migration/sadighi-wordpress-seo-
# audit/production-redirect-audit.csv) that were still 404ing on live
# production with no existing map entry. Classified in priority order:
# (1) exact knowledge-articles.ts slug match, (2) a pre/post-surgical
# "care" article matched to its specific care-instructions/[slug] page
# (more precise than the generic service page), (3) Hamid's semantic
# fallback keyword rules from the P0 task instructions (implant->advanced-
# dental-implant, جراحی فک->orthognathic-surgery, بینی/رینوپلاستی->
# rhinoplasty, لیفت/بلفاروپلاستی/زیبایی صورت->facial-cosmetic-surgery,
# نمونه درمان/گالری/قبل و بعد->before-after, contact/about/services as
# named). English-locale legacy URLs (/en/...) get an /en/-prefixed
# target, never a bare/Persian one — see apply_locale_prefix in the
# scratch categorize.py this was generated from (not checked into the
# repo). /جراحی-برجستگی-پیشانی (and its one permalink variant) is
# deliberately excluded here — STILL_BLOCKED, unchanged.
#
# 161 further 404ing URLs were classified WordPress taxonomy/archive/
# system paths (/tag/, /category/, /author/, /page/N, /feed, /wp-json,
# /wp-content/, /wp-admin/, ?s= search) with no content equivalent —
# intentionally left unmapped, not redirected to a generic fallback.
# 70 more had no exact-slug or keyword-bucket match at all (mostly
# near-zero-click WP media/attachment/junk slugs, plus a handful of
# genuinely ambiguous real topics — CAS/computer-assisted-surgery,
# condylar hyperplasia, FAQ/testimonials index pages) — left as 404,
# flagged as "needs human decision" in production-redirect-audit.csv
# rather than guessed.
P0_BROAD_AUDIT_20260826 = {
    "/25-سوال-متداول-در-مورد-تزریق-بوتاکس-برای": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: بوتاکس); 7c/471i
    "/25-سوال-متداول-در-مورد-جراحی-لیفت-صورت-که": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: لیفت); 58c/929i
    "/25-سوال-متداول-در-مورد-جراحی-لیفت-صورت-که/photo_2024-07-15_20-57-10": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: لیفت); 0c/1i
    "/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه-2": "/knowledge/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه",  # exact knowledge-article slug match (WP duplicate-slug suffix stripped); 31c/1081i
    "/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه/25-سوال-متداول-در-مورد-جراحی-چانه-و-زاویه": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چانه); 0c/2i
    "/about-us/)": "/about",  # keyword-bucket fallback (matched: about); 0c/1i
    "/appointment-form": "/contact",  # hardcoded best-effort mapping (no clean keyword bucket, unambiguous intent); 7c/2592i
    "/best-dental-implant-specialist": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: implant); 0c/0i
    "/best-rhinoplasty-surgeon-tabriz": "/services/rhinoplasty",  # keyword-bucket fallback (matched: rhinoplasty); 2c/62i
    "/blog": "/knowledge",  # hardcoded best-effort mapping (no clean keyword bucket, unambiguous intent); 1c/187i
    "/blog-en": "/en/knowledge",  # hardcoded best-effort mapping (no clean keyword bucket, unambiguous intent); 4c/298i
    "/blog/جراحی-دندان/ایمپلنت": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 17c/530i
    "/blog/جراحی-دندان/ایمپلنت/دندانپزشک": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 2c/72i
    "/blog/جراحی-دندان/جراحی-دندان-عقل": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 0c/74i
    "/blog/جراحی-زیبایی/تزریق-چربی": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چربی); 0c/8i
    "/blog/جراحی-زیبایی/جراحی-زیبایی-بینی": "/services/rhinoplasty",  # keyword-bucket fallback (matched: بینی); 1c/23i
    "/blog/جراحی-فک": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/123i
    "/blog/دسته-بندی-نشده/سینوس-لیفت": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: لیفت); 3c/114i
    "/comprehensive-guide-to-lower-jaw-surgery-everything-you-need-to-know": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 0c/90i
    "/contact/special-equipment-for-a-dentist-dentist-office": "/contact",  # keyword-bucket fallback (matched: contact); 0c/2i
    "/dall·e-2024-11-20-01-14-58-a-clean-and-visually-appealing-illustration-about-wisdom-teeth-showing-the-anatomy-of-the-jaw-and-the-position-of-wisdom-teeth-without-any-text-or-lo-2": "/about",  # keyword-bucket fallback (matched: about); 0c/3i
    "/dall·e-2024-11-30-16-33-45-a-realistic-close-up-depiction-of-an-impacted-wisdom-tooth-causing-gum-swelling-and-discomfort-the-focus-is-on-a-detailed-dental-anatomy-with-the-su-2": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: wisdom-tooth); 0c/1i
    "/digital-technology-in-corrective-facial-asymmetry-surgery": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: asymmetry); 0c/47i
    "/en/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی": "/en/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چربی); 4c/250i
    "/en/comprehensive-guide-to-lower-jaw-surgery-everything-you-need-to-know": "/en/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 0c/81i
    "/en/dall·e-2024-11-20-01-14-58-a-clean-and-visually-appealing-illustration-about-wisdom-teeth-showing-the-anatomy-of-the-jaw-and-the-position-of-wisdom-teeth-without-any-text-or-lo-2": "/en/about",  # keyword-bucket fallback (matched: about); 0c/2i
    "/en/digital-technology-in-corrective-facial-asymmetry-surgery": "/en/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: asymmetry); 0c/1i
    "/en/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment": "/en/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: trauma); 3c/416i
    "/en/lower-jaw-surgery-for-receding-jaw-improving-function-and-aesthetics": "/en/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 1c/83i
    "/en/lower-jaw-surgery-for-receding-jaw-improving-function-and-aesthetics/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود": "/en/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/3i
    "/en/post-surgery-jaw-physiotherapy-a-comprehensive-guide-for-faster-recovery-with-effective-exercises": "/en/care-instructions/jaw-physiotherapy",  # care-instructions bucket (matched: physiotherapy); 2c/358i
    "/en/receding-jaw-surgery-recovery-and-long-term-results": "/en/care-instructions/jaw-surgery-care",  # care-instructions bucket (matched: jaw); 0c/34i
    "/en/receding-jaw-surgery-recovery-and-long-term-results/جراحی-فک-پایین-عقب-رفته-2": "/en/care-instructions/jaw-surgery-care",  # care-instructions bucket (matched: فک); 0c/15i
    "/en/recessed-lower-jaw-causes-symptoms-and-treatment": "/en/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 1c/1830i
    "/en/sinos-lift-2": "/en/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: lift); 0c/2i
    "/en/what-is-a-recessed-lower-jaw-causes-symptoms-and-the-importance-of-treatment": "/en/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 0c/0i
    "/en/آیا-جراحی-فک-خطرناک-است؟-2": "/en/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/10i
    "/en/ایمپلنت-2-2": "/en/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/2i
    "/en/صفحه-اصلی/1-5-2": "/en",  # keyword-bucket fallback (matched: صفحه-اصلی); 0c/4i
    "/en/صفحه-اصلی/doctor-holding-dentist-2": "/en",  # keyword-bucket fallback (matched: صفحه-اصلی); 0c/4i
    "/en/صفحه-اصلی/downloadfile-42-2": "/en",  # keyword-bucket fallback (matched: صفحه-اصلی); 0c/61i
    "/en/صفحه-اصلی/impalnet-2": "/en",  # keyword-bucket fallback (matched: صفحه-اصلی); 0c/1i
    "/en/فک-تبریز-2": "/en/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/80i
    "/en/وفقیت-۱۳-واحد-ایمپلنت-پساز-دو-سال-بی-ه-2": "/en/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/1i
    "/european-nose-job-what-is-it-and-who-is-it-for": "/services/rhinoplasty",  # keyword-bucket fallback (matched: nose); 0c/0i
    "/eyebrow-gliding-lift": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: lift); 6c/66i
    "/facial-asymmetry-due-to-trauma-causes-diagnosis-and-treatment": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: trauma); 26c/2180i
    "/facial-rejuvenation-with-fillers-a-quick-and-effective-path-to-natural-beauty-in-tehran-and-tabriz": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: facial); 0c/123i
    "/genioplasty-aftercare": "/care-instructions/genioplasty-care",  # care-instructions bucket (matched: genioplasty); 0c/0i
    "/implant-cost-tabriz": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: implant); 0c/0i
    "/installment-dental-implant": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: implant); 0c/0i
    "/jaw-clicking-and-tmj-disorders-causes-treatments-and-solutions": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 0c/37i
    "/lower-jaw-surgery-for-receding-jaw-improving-function-and-aesthetics": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 0c/363i
    "/optimal-timing-for-wisdom-tooth-surgery-jaw-surgery-and-dental-implants-during-orthodontic-treatment": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: wisdom-tooth); 0c/129i
    "/post-surgery-jaw-physiotherapy-a-comprehensive-guide-for-faster-recovery-with-effective-exercises": "/care-instructions/jaw-physiotherapy",  # care-instructions bucket (matched: physiotherapy); 10c/636i
    "/receding-jaw-surgery-recovery-and-long-term-results": "/care-instructions/jaw-surgery-care",  # care-instructions bucket (matched: jaw); 0c/48i
    "/recessed-lower-jaw-causes-symptoms-and-treatment": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 9c/9983i
    "/recovery-period-of-chin-surgery-comparison-with-chin-implants-and-expertise-of-dr-alireza-sedighi": "/care-instructions/genioplasty-care",  # hardcoded precision fix (keyword-bucket order would otherwise mis-route this one); 5c/203i
    "/sinos-lift-2": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: lift); 1c/1i
    "/sinus-lift-care": "/care-instructions/sinus-lift-care",  # care-instructions bucket (matched: sinus); 0c/0i
    "/sinus-lift-surgery-pre-post-care-guide": "/care-instructions/sinus-lift-care",  # care-instructions bucket (matched: sinus); 21c/477i
    "/treatment-of-facial-asymmetry-solutions-the-role-of-nuclear-medicine-scans-and-the-appropriate-age-for-jaw-surgery": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: asymmetry); 1c/17i
    "/why-choose-dr-alireza-sedighi-for-jaw-surgery-a-top-choice-for-precision-and-excellence": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: jaw); 0c/0i
    "/آشنایی-با-انواع-عمل-جراحی-زیبایی-صورت": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: زیبایی-صورت); 9c/2287i
    "/آیا-جراحی-فک-خطرناک-است؟": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/140i
    "/آیا-جراحی-فک-خطرناک-است؟/آیا-جراحی-فک-خطرناک-است؟": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/8i
    "/اموزش-دوره-ها-تخصصی-ایمپلنت": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 37c/314i
    "/انواع-تزریق-چربی-میکروفت،-نانوفت-و-سای": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چربی); 42c/1571i
    "/انواع-تزریق-چربی-میکروفت،-نانوفت-و-سای/charbi": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چربی); 0c/19i
    "/انواع-روش-های-جراحی-چانه": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چانه); 1c/1239i
    "/انواع-روش-های-جراحی-چانه/untitled-3": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چانه); 0c/22i
    "/ایمپلنت-اشترومن-در-تبریز؛-بهترین-راه": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 10c/119i
    "/ایمپلنت-اقساطی-در-تهران": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 1c/1603i
    "/ایمپلنت-اقساطی-در-تهران-برای-همه؛-از-دغ": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/ایمپلنت-در-تهران": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 1c/125i
    "/ایمپلنت-در-تهران-از-نگاه-بیماران؛-مقای": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/ایمپلنت-دندان": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/ایمپلنت-دندان-اقساطی": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 25c/1452i
    "/ایمپلنت-دندان-اقساطی-کاشت-دندان-با-ش": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/ایمپلنت-دندان-اقساطی-کاشت-دندان-با-ش/photo_2025-03-28_17-18-17": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 1c/29i
    "/ایمپلنت-دندان-بدون-درد": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/453i
    "/ایمپلنت-دندان-بدون-درد-راهی-برای-لبخند": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/91i
    "/ایمپلنت-دندان-در-تعطیلات-عید-در-تبریز": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/ایمپلنت-دندان-قیمت-ایمپلنت-دندان": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 2c/45i
    "/ایمپلنت-دندان-چیست": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/721i
    "/ایمپلنت-دندان-چیست-و-چگونه-عمل-میکند": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/ایمپلنت-دیجیتال": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 1c/163i
    "/ایمپلنت-دیجیتال-تحولی-نوین-در-دندان": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/6i
    "/ایمپلنت-ساب-پریوستئال-دیجیتال": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 3c/115i
    "/ایمپلنت-سوئیسی-دیجیتالی": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 2c/237i
    "/ایمپلنت-سوئیسی-دیجیتالی؛-بهترین-راه": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/ایمپلنت-فوری-در-تبریز-راهکاری-سریع-و-م/ایمپلنت-فوری-در-تبریز": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/64i
    "/ایمپلنت-یک-روزه": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/47i
    "/بهترین-برندهای-ایمپلنت-دندانی-اشتروم": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 4c/170i
    "/بهترین-تخصص-ایمپلنت-تبریز-و-معرفی-دکت": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/1i
    "/بهترین-جراح-فک-در-تبریز-راهنمای-مامل-ا": "/about",  # keyword-bucket fallback (matched: بهترین-جراح); 0c/1i
    "/بهترین-جراح-فک-در-تبریز-راهنمای-کامل-ا": "/about",  # keyword-bucket fallback (matched: بهترین-جراح); 59c/5148i
    "/بهترین-جراح-فک-در-تبریز-راهنمای-کامل-ا/فک-تبریز": "/about",  # keyword-bucket fallback (matched: بهترین-جراح); 1c/53i
    "/بهترین-دندانپزشک-برای-ایمپلنت-دندان-د": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 7c/1440i
    "/بهترین-متخصص-ایملنت-ت�بریز-و-معرفی-دکت": "/about",  # keyword-bucket fallback (matched: بهترین-متخصص); 0c/1i
    "/بهترین-متخصص-ایپلنت-تبریز-و-معرفی-دکت": "/about",  # keyword-bucket fallback (matched: بهترین-متخصص); 0c/1i
    "/بوتاکس": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: بوتاکس); 10c/8278i
    "/بوتاکس-برای-جوانسازی-پیشانی-و-دور-چشم-ر": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: پیشانی); 3c/315i
    "/بیماری-کندیلار-هایپرپلاژیا-علل،-تشخی": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: کندیلار); 22c/335i
    "/تازه-های-فک-و-صورت": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/11i
    "/تزریق-بوتاکس-برای-از-بین-بردن-دندان-قرو": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: بوتاکس); 44c/1167i
    "/تزریق-بوتاکس-برای-از-بین-بردن-دندان-قرو/botox-injection-for": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: بوتاکس); 1c/32i
    "/تزریق-فیلر": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: فیلر); 6c/200i
    "/تفاوت-جراحی-دندان-عقل-با-کشیدن-ساده": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 5c/375i
    "/تفاوت-جراحی-دندان-عقل-با-کشیدن-ساده/تفاوت-جراحی-دندان-عقل-با-کشیدن-ساده": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 0c/3i
    "/توضیحاتی-در-مورد-ایمپلنت-دیجیتال": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/8i
    "/جراحی-ایمپلنت": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/4i
    "/جراحی-ایمپلنت-2": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 29c/3018i
    "/جراحی-بلفاروپلاستی": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: بلفاروپلاستی); 4c/63i
    "/جراحی-بینی": "/services/rhinoplasty",  # keyword-bucket fallback (matched: بینی); 6c/218i
    "/جراحی-بینی-به-سایت-اروپایی-زیبایی-و-تقا": "/services/rhinoplasty",  # keyword-bucket fallback (matched: بینی); 0c/1i
    "/جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا/photo_2024-07-29_12-16-45": "/services/rhinoplasty",  # keyword-bucket fallback (matched: بینی); 0c/1i
    "/جراحی-جلوآمدگی-فک-پایین": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/0i
    "/جراحی-جلوآمدگی-فک-پایین-2": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 14c/1362i
    "/جراحی-دندان-عقل": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 5c/1102i
    "/جراحی-دندان-عقل-با-بیهوشی-در-تبریز/)": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 0c/1i
    "/جراحی-دندان-عقل-با-بیهوشی-در-تبریز/جراحی-دندان-عقل-با-بیهوشی-در-تبریز": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 1c/36i
    "/جراحی-دندان-عقل-در-تهران-و-تبریز-چرا-ان": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 2c/62i
    "/جراحی-دیجیتال-فک": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 41c/385i
    "/جراحی-زیبایی-بینی-راهنمای-کامل-عمل-بین": "/services/rhinoplasty",  # keyword-bucket fallback (matched: بینی); 0c/0i
    "/جراحی-سینوس-لیفت-چیست؟": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: لیفت); 9c/809i
    "/جراحی-فک-2": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 19c/10050i
    "/جراحی-فک-ارتوگناتیک-مراحل-و-روند-درما": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 3c/672i
    "/جراحی-فک-به-روش-دیجیتال": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 5c/226i
    "/جراحی-فک-خطرناک": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 19c/2225i
    "/جراحی-فک-دیجیتال": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 20c/339i
    "/جراحی-فک-دیجیتال-انقلابی-در-دقت-و-نتایج": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 1c/15i
    "/جراحی-فک-نی-نی-سایت/جراحی-فک-نی-نی-سایت": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 2c/78i
    "/جراحی-فک-و-دندان": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 8c/7908i
    "/جراحی-فک-و-مواردی-که-باید-بدانید": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 3c/84i
    "/جراحی-فک-پایین-عقب-رفته-بهبودی-و-نتایج/جراحی-فک-پایین-عقب-رفته": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 1c/1i
    "/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود/جراحی-فک-پایین-عقب-رفته-راهی-برای-بهبود": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/1i
    "/جراحی-فک-چیست-و-چرا-انجام-میشود؟": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 5c/1113i
    "/جراحی-فک-کم-تهاجمی": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 17c/395i
    "/جراحی-فک-کمتهاجمی-روشی-نوین-برای-درم": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/0i
    "/جراحی-ناقرینگیهای-صورت-رویکردها-و-م": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: ناقرینگی); 25c/1930i
    "/جراحی-ناقرینگیهای-صورت-رویکردها-و-م/برای-غیر-قرینگی": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: ناقرینگی); 0c/12i
    "/جراحی-چانه-پروتز-فیلر-جینیوپلاستی": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چانه); 31c/2482i
    "/جراحی-چانه،-پروتز-چانه،-فیلر-و-جینیوپل": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چانه); 10c/633i
    "/جوانسازی-صورت-با-فیلر-تهران-و-تبریز": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: فیلر); 9c/642i
    "/جوانسازی-صورت-با-فیلر-راهی-سریع-و-مؤثر": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: فیلر); 0c/71i
    "/خدمات": "/services",  # keyword-bucket fallback (matched: خدمات); 1c/31i
    "/خدمات-ما": "/services",  # keyword-bucket fallback (matched: خدمات); 0c/93i
    "/درد-دندان-عقل": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 9c/335i
    "/درمان-غیر-قرینگی-صورت-راهکارها،-نقش-اس": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: غیر-قرینگی); 12c/139i
    "/دوره-نقاهت-جراحی-چانه،-مقایسه-با-پروتز": "/care-instructions/genioplasty-care",  # care-instructions bucket (matched: چانه); 25c/1913i
    "/دکتر-علیرضا-صدیقی-2": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/29i
    "/دکتر-علیرضا-صدیقی/23-2": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 5c/239i
    "/دکتر-علیرضا-صدیقی/attachment/23": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/3i
    "/دکتر-علیرضا-صدیقی/bini": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 1c/3i
    "/دکتر-علیرضا-صدیقی/bini-2": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/1i
    "/دکتر-علیرضا-صدیقی/cas": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/7i
    "/دکتر-علیرضا-صدیقی/cosmetic-surgery": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/1i
    "/دکتر-علیرضا-صدیقی/downloadfile-52": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/1i
    "/دکتر-علیرضا-صدیقی/dr-sadighi": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/1i
    "/دکتر-علیرضا-صدیقی/goz-kapagi-estetigi": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/3i
    "/دکتر-علیرضا-صدیقی/impalnet": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/2i
    "/دکتر-علیرضا-صدیقی/n17_60_11zon": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/9i
    "/دکتر-علیرضا-صدیقی/n3_52_11zon": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/2i
    "/دکتر-علیرضا-صدیقی/n7_54_11zon": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/15i
    "/دکتر-علیرضا-صدیقی/rezayat1_64_11zon": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/2i
    "/دکتر-علیرضا-صدیقی/لیفت-ابرو_5": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/27i
    "/دکتر-علیرضا-صدیقی/لیفت-صورت-2": "/about",  # keyword-bucket fallback (matched: دکتر-علیرضا-صدیقی); 0c/2i
    "/راهنمای-جامع-ایمپلنت-دندان-در-تبریز": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 50c/234i
    "/راهنمای-جامع-ایمپلنت-دندان-در-تبریز-2": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 7c/332i
    "/راهنمای-جامع-ایمپلنت-دندان-در-تبریز-مع": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 6c/296i
    "/راهنمای-جامع-جراحی-فک-پایین-جلو-آمده-هر/راهنمای-جامع-جراحی-فک-پایین-جلو-آمده-هر": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/158i
    "/راهنمای-جامع-کاشت-دندان-و-ایمپلنت-در-تب": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 2c/78i
    "/رضایت-بیمار-از-جراحی-بینی": "/services/rhinoplasty",  # keyword-bucket fallback (matched: بینی); 1c/158i
    "/رضایت-بیمار-از-جراحی-فک": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 12c/192i
    "/رضایت-بیمار-از-جراحی-فک-بالا-و-پایین": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 2c/16i
    "/رضایت-بیمار-از-جراحی-فک/vid-47641124-002718-228-1": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 0c/1i
    "/رضایت-بیمار-پس-از-جراحی-بلفاروپلاستی": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: بلفاروپلاستی); 7c/110i
    "/روشهای-نوین-جراحی-برای-اصلاح-جلوآمدگ": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: جلوآمدگ); 3c/33i
    "/روند-درمانی-و-ترتیب-درمانی-جراحی-فک،-ای": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 1c/12i
    "/رینوپلاستی-بینی-گوشتی": "/services/rhinoplasty",  # keyword-bucket fallback (matched: بینی); 0c/10i
    "/رینوپلاستی-چیست؟": "/services/rhinoplasty",  # keyword-bucket fallback (matched: رینوپلاستی); 9c/515i
    "/سوالات-متداول-ایمپلنت": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 1c/34i
    "/سوالات-متداول-بلفاروپلاستی": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: بلفاروپلاستی); 4c/52i
    "/سینوس-لیفت-تخصصی-و-کاشت-ایمپلنت-دندان-ب": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 1c/60i
    "/سینوس-لیفت-و-ایمپلنت-دندان": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 18c/888i
    "/سینوس-لیفت-چیست؟": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: لیفت); 0c/1i
    "/شکاف-لب-و-کام-چیست؟": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: شکاف-لب-و-کام); 0c/205i
    "/شکاف-لب-و-کام-چیست؟/d067f6de43bb2ff994f11414142d60ab-cleft-lip-palate": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: شکاف-لب-و-کام); 0c/1i
    "/صدای-فک-و-اختلالات-مفصل-tmj-علل،-راهکارها": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 10c/469i
    "/صفحه-اصلی": "/",  # keyword-bucket fallback (matched: صفحه-اصلی); 22c/1354i
    "/صفحه-اصلی/23-3": "/",  # keyword-bucket fallback (matched: صفحه-اصلی); 1c/48i
    "/صفحه-اصلی/234-2": "/",  # keyword-bucket fallback (matched: صفحه-اصلی); 0c/69i
    "/طول-عمر-ایمپلنت-دندان": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/144i
    "/طول-عمر-ایمپلنت-دندان-چقدر-است؟-بررسی-ج": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/عوارض-ایمپلنت-دندان": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 11c/1560i
    "/عوارض-ایمپلنت-دندان-واقعیت-یا-نگرانی-ب": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/0i
    "/فک-پایین-عقبرفته": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 9c/796i
    "/فک-پایین-عقبرفته-چیست؟-دلایل،-علائم": "/services/orthognathic-surgery",  # keyword-bucket fallback (matched: فک); 1c/48i
    "/فیزیوتراپی-بعد-از-جراحی-فک-راقنمای-کام": "/care-instructions/jaw-physiotherapy",  # care-instructions bucket (matched: فیزیوتراپی); 0c/1i
    "/لیفت-ابرو-وشقیقه": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: لیفت); 0c/1i
    "/لیفت-صورت": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: لیفت); 4c/3420i
    "/لیپوساکشن-و-تزریق-چربی-روشهای-نوین-ج": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: چربی); 4c/521i
    "/مراقبت-بعد-از-جراحی-دندان-عقل": "/care-instructions/wisdom-tooth-care",  # care-instructions bucket (matched: دندان-عقل); 8c/188i
    "/مراقبت-بینی": "/care-instructions/rhinoplasty-care",  # care-instructions bucket (matched: بینی); 0c/0i
    "/مراقبت-جراحی-بلفاروپلاستی-ابرو": "/care-instructions/blepharoplasty-care",  # care-instructions bucket (matched: بلفارو); 0c/60i
    "/مراقبت-جراحی-بینی": "/care-instructions/rhinoplasty-care",  # care-instructions bucket (matched: بینی); 6c/110i
    "/مراقبت-جراحی-فک": "/care-instructions/jaw-surgery-care",  # care-instructions bucket (matched: فک); 19c/736i
    "/مراقبت-های-بعد-از-عمل/مراقبت-بعد-از-جراحی-دندان-عقل": "/care-instructions/wisdom-tooth-care",  # care-instructions bucket (matched: دندان-عقل); 1c/4i
    "/مراقبت-های-بعد-از-عمل/مراقبتهای-جراحی-لیفت": "/care-instructions/facelift-browlift-care",  # care-instructions bucket (matched: لیفت); 0c/1i
    "/مراقبت-های-جراحی-ایمپلنت": "/care-instructions/implant-care",  # care-instructions bucket (matched: ایمپلنت); 9c/343i
    "/مراقبتهای-قبل-از-عمل-لیفت": "/care-instructions/facelift-browlift-care",  # care-instructions bucket (matched: لیفت); 4c/40i
    "/مراقبتهای-قبل-و-بعد-از-جراحی-سینوس-لی": "/care-instructions/sinus-lift-care",  # care-instructions bucket (matched: سینوس); 36c/778i
    "/مزایای-جراحی-فک-و-معرفی-بهترین-جراح-فک،": "/about",  # keyword-bucket fallback (matched: بهترین-جراح); 16c/734i
    "/مقالات": "/knowledge",  # hardcoded best-effort mapping (no clean keyword bucket, unambiguous intent); 3c/41i
    "/مقالات-2": "/knowledge",  # keyword-bucket fallback (matched: مقالات); 0c/27i
    "/مقایسه-ایمپلنت-و-دندان-طبیعی-بررسی-تفا": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 17c/461i
    "/موفقیت-۱۳-واحد-ایمپلنت-پساز-دو-سال-بی": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 1c/130i
    "/ناقرینگیهای-ناشی-از-تروما-به-صورت-عل": "/services/facial-reconstruction-surgery",  # keyword-bucket fallback (matched: تروما); 46c/1808i
    "/نمونه-درمان/n13": "/before-after",  # keyword-bucket fallback (matched: نمونه-درمان); 0c/17i
    "/نمونه-درمان/n27": "/before-after",  # keyword-bucket fallback (matched: نمونه-درمان); 0c/10i
    "/نمونه-درمان/n36": "/before-after",  # keyword-bucket fallback (matched: نمونه-درمان); 0c/1i
    "/همه-آنچه-باید-در-مورد-ایمپلنت-دندان-بدا": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/2i
    "/همه-چیز-در-مورد-دندان-عقل": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 6c/348i
    "/همه-چیز-در-مورد-رینوپلاستی": "/services/rhinoplasty",  # keyword-bucket fallback (matched: رینوپلاستی); 0c/2i
    "/همهچیز-درباره-دندان-عقل-زمان-مناسب-ب": "/about",  # keyword-bucket fallback (matched: درباره); 1c/113i
    "/همهچیز-درباره-دندان-عقل-زمان-مناسب-ب/dall·e-2024-11-20-01-14-58-a-clean-and-visually-appealing-illustration-about-wisdom-teeth-showing-the-anatomy-of-the-jaw-and-the-position-of-wisdom-teeth-without-any-text-or-lo": "/about",  # keyword-bucket fallback (matched: درباره); 0c/1i
    "/پروتز-گونه": "/services/facial-cosmetic-surgery",  # keyword-bucket fallback (matched: گونه); 21c/5521i
    "/پیوند-استخوان-برای-ایمپلنتهای-دندان": "/services/advanced-dental-implant",  # keyword-bucket fallback (matched: ایمپلنت); 0c/12i
    "/چرا-دندان-عقل-درد-میکند؟-دلایل-و-راه": "/services/impacted-tooth-surgery",  # keyword-bucket fallback (matched: دندان-عقل); 0c/39i
    "/چرا-دکتر-علیرضا-صدیقی-را-برای-جراحی-فک-ا": "/about",  # keyword-bucket fallback (matched: چرا-دکتر); 39c/1723i
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

    for old_path, new_path in P0_INCIDENT_FIXES_20260826.items():
        entries[old_path] = (new_path, "P0 production incident fix 2026-08-26")

    for old_path, new_path in P0_BROAD_AUDIT_20260826.items():
        entries[old_path] = (new_path, "P0 broad audit 2026-08-26")

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

    # P0 production incident (2026-08-25): "/contact": "/contact" made it into
    # the generated map — old WordPress `/contact/` legitimately maps to
    # `/fa/contact` in the spec, but `strip_fa_prefix` (applied below, at
    # emission time) turns that into bare `/contact`, which is IDENTICAL to
    # the already-stripped old path for this one row. middleware.ts issues a
    # 301 whenever `resolveLegacyPath` returns non-null, with no "is the
    # target the same as what was just requested" check — so this single bad
    # row caused an infinite self-redirect on live production. Filtered here
    # at the source (never emit a same-path redirect) AND independently
    # guarded in middleware.ts itself (belt and suspenders — this map should
    # never regain the ability to cause this class of bug, from this source
    # or any future one).
    self_redirect_count = 0
    lines = []
    for old_path in sorted(entries):
        new_path, note = entries[old_path]
        final_new_path = strip_fa_prefix(new_path)
        if final_new_path == old_path:
            self_redirect_count += 1
            print(f"SKIPPING self-redirect: {old_path!r} would map to itself ({note}) — old WordPress path collides with the new site's own current path.")
            continue
        lines.append(f"  {js_str(old_path)}: {js_str(final_new_path)}, // {note}")

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
 * (from stage-2's unmatched-gsc-priority.csv), {rank_math_added} merged in
 * from the Rank Math redirect audit (rank-math-redirects/rank-math-redirects-
 * merge-plan.csv) — Rank Math's own `destination` column pointed at OTHER
 * old WordPress URLs, not Next.js paths, so each of those {rank_math_added} rows is a
 * 2-hop chain (rank-math source -> old WP page -> this map's existing
 * target) collapsed here into one direct rule — and {len(P0_BROAD_AUDIT_20260826)}
 * from the 2026-08-26 broad production audit (P0_BROAD_AUDIT_20260826
 * above), covering every OTHER legacy URL found 404ing on live production
 * with real GSC/WordPress traffic, not only the 5 originally-reported
 * examples (see production-redirect-audit.csv for the full audit).
 *
 * Deliberately EXCLUDED, per Hamid's explicit "keep blocked" instruction —
 * do not add until its content has been manually reviewed and a
 * destination confirmed (see manual-decisions-needed.md item 4, and
 * rank-math-redirects-summary.md's "Blocked" section for the matching
 * rank-math alias):
 *   - /جراحی-برجستگی-پیشانی/
 * (/نمونه-درمان/ was ALSO blocked here until 2026-08-26, when a P0
 * production incident — this URL 404ing with real search traffic —
 * prompted a newer, more specific instruction that explicitly redirects
 * it to /before-after instead; see P0_INCIDENT_FIXES_20260826 above and
 * production-redirect-audit.csv for the full incident.)
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
    print(f"Wrote {len(lines)} redirect entries -> {OUT_TS} ({rank_math_added} from rank-math merge, {self_redirect_count} self-redirects skipped)")
    blocked_in_spec = [r["old_path"] for r in rows if strip_slash(r["old_path"]) in STILL_BLOCKED]
    print(f"Still blocked (excluded): {blocked_in_spec}")


if __name__ == "__main__":
    main()
