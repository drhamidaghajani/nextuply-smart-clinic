# Rank Math Redirect Audit — Summary

Parsed **42** rows from `_rank-math-redirections-2026-08-23_12-23-06.csv` — 2 were byte-for-byte duplicates of an earlier row in the same export and were merged/dropped before classification, leaving **40** unique redirect rules evaluated below.

## Key finding

Rank Math's `destination` column is not a Next.js URL — every row points at another **old WordPress URL** (e.g. row id=3's destination decodes to `/ایمپلنت-فوری-در-تبریز`, itself a legacy permalink). Every row is therefore inherently a 2-hop chain (`rank-math source → old WP page → wherever that old WP page's own redirect points`), resolved here by checking whether the destination is already a key in `LEGACY_REDIRECTS` — if so, the chain collapses into one direct rule from the rank-math source straight to the real Next.js destination.

## merge_action breakdown

- **out-of-scope-low-priority**: 26
- **add-to-nextjs-redirect-map**: 10
- **already-covered**: 3
- **blocked-needs-manual-review**: 1

## Rows to add (10)

| id | source | final_destination |
|---|---|---|
| 3 | `/ایمپلنت-فوری-در-تبریز-راهکاری-سریع-و-م` | `/fa/knowledge/ایمپلنت-فوری-در-تبریز` |
| 4 | `/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل-هرآ` | `/fa/knowledge/تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل` |
| 7 | `/جراحی-فک-پایین-عقب-رفته-بهبودی-و-نتایج` | `/fa/knowledge/جراحی-فک-پایین-عقب-رفته` |
| 9 | `/جراحی-فک-پایین-عقب-رفته-2` | `/fa/knowledge/جراحی-فک-پایین-عقب-رفته` |
| 11 | `/مراحل-جراحی-فک-در-اتاق-عمل-از-برنامهر` | `/fa/knowledge/فیلم_جراحی_فک_در_اتاق_عمل` |
| 11 | `/فیلم-جراحی-فک-در-اتاق-عمل` | `/fa/knowledge/فیلم_جراحی_فک_در_اتاق_عمل` |
| 19 | `/راهنمای-جامع-جراحی-فک-پایین-جلو-آمده-هر` | `/fa/knowledge/جراحی-فک-پایین-جلو-آمده` |
| 21 | `/فیزیوتراپی-بعد-از-جراحی-فک-چرا-ضروری-اس` | `/fa/knowledge/فیزیوتراپی-بعد-از-جراحی-فک` |
| 24 | `/ایمپلنت-دندان-در-تبریز؛-پرسشهای-پرتک` | `/fa/knowledge/ایمپلنت-دندان-در-تبریز-پرسش-پاسخ` |
| 35 | `/عمل-بینی-اروپایی-چیست-و-برای-چه-چهرهه` | `/fa/knowledge/european-nose-job` |

## Blocked (kept out, per Hamid's instruction)

- id 12: `/جراحی-برجستگی-پیشانی-روشها،-مزایا-و` → `/جراحی-برجستگی-پیشانی`

## Out of scope (destination not yet migrated, or English-locale alias)

- id 1: `/news` → `/دکتر-علیرضا-صدیقی-2` (Destination (/دکتر-علیرضا-صدیقی-2) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 2: `/en/what-is-a-recessed-lower-jaw-causes-symptoms-and-the-importance-of-treatment` → `/en/recessed-lower-jaw-causes-symptoms-and-treatment` (Destination (/en/recessed-lower-jaw-causes-symptoms-and-treatment) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 5: `/ایمپلنت-سوئیسی-دیجیتالی؛-بهترین-راه` → `/ایمپلنت-سوئیسی-دیجیتالی` (Destination (/ایمپلنت-سوئیسی-دیجیتالی) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 6: `/ایمپلنت-دندان-بدون-درد-راهی-برای-لبخند` → `/ایمپلنت-دندان-بدون-درد` (Destination (/ایمپلنت-دندان-بدون-درد) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 8: `/جوانسازی-صورت-با-فیلر-راهی-سریع-و-مؤثر` → `/جوانسازی-صورت-با-فیلر-تهران-و-تبریز` (Destination (/جوانسازی-صورت-با-فیلر-تهران-و-تبریز) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 10: `/جراحی-فک-کمتهاجمی-روشی-نوین-برای-درم` → `/جراحی-فک-کم-تهاجمی` (Destination (/جراحی-فک-کم-تهاجمی) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 13: `/ایمپلنت-دندان-اقساطی-کاشت-دندان-با-ش` → `/ایمپلنت-دندان-اقساطی` (Destination (/ایمپلنت-دندان-اقساطی) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 14: `/ایمپلنت-دیجیتال-تحولی-نوین-در-دندان` → `/ایمپلنت-دیجیتال` (Destination (/ایمپلنت-دیجیتال) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 15: `/ایمپلنت-دندان-راهکاری-برای-بازگرداند` → `/ایمپلنت-دندان` (Destination (/ایمپلنت-دندان) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 16: `/جراحی-فک-دیجیتال-انقلابی-در-دقت-و-نتایج` → `/جراحی-فک-دیجیتال` (Destination (/جراحی-فک-دیجیتال) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 17: `/آیا-جراحی-فک-خطرناک-است؟` → `/جراحی-فک-خطرناک` (Destination (/جراحی-فک-خطرناک) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 18: `/فک-پایین-عقبرفته-چیست؟-دلایل،-علائم` → `/فک-پایین-عقبرفته` (Destination (/فک-پایین-عقبرفته) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 20: `/روشهای-نوین-جراحی-برای-اصلاح-جلوآمدگ` → `/جراحی-جلوآمدگی-فک-پایین-2` (Destination (/جراحی-جلوآمدگی-فک-پایین-2) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 20: `/جراحی-جلوآمدگی-فک-پایین` → `/جراحی-جلوآمدگی-فک-پایین-2` (Destination (/جراحی-جلوآمدگی-فک-پایین-2) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 22: `/ایمپلنت-دندان-چیست-و-چگونه-عمل-میکند` → `/ایمپلنت-دندان-چیست` (Destination (/ایمپلنت-دندان-چیست) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 23: `/عوارض-ایمپلنت-دندان-واقعیت-یا-نگرانی-ب` → `/عوارض-ایمپلنت-دندان` (Destination (/عوارض-ایمپلنت-دندان) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 25: `/ایمپلنت-در-تهران-از-نگاه-بیماران؛-مقای` → `/ایمپلنت-در-تهران` (Destination (/ایمپلنت-در-تهران) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 26: `/ایمپلنت-اقساطی-در-تهران-برای-همه؛-از-دغ` → `/ایمپلنت-اقساطی-در-تهران` (Destination (/ایمپلنت-اقساطی-در-تهران) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 27: `/طول-عمر-ایمپلنت-دندان-چقدر-است؟-بررسی-ج` → `/طول-عمر-ایمپلنت-دندان` (Destination (/طول-عمر-ایمپلنت-دندان) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 28: `/راهنمای-جامع-ایمپلنت-دندان-در-تبریز-مع` → `/راهنمای-جامع-ایمپلنت-دندان-در-تبریز-2` (Destination (/راهنمای-جامع-ایمپلنت-دندان-در-تبریز-2) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 29: `/جراحی-چانه،-پروتز-چانه،-فیلر-و-جینیوپل` → `/جراحی-چانه-پروتز-فیلر-جینیوپلاستی` (Destination (/جراحی-چانه-پروتز-فیلر-جینیوپلاستی) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 31: `/سینوس-لیفت-تخصصی-و-کاشت-ایمپلنت-دندان-ب` → `/سینوس-لیفت-و-ایمپلنت-دندان` (Destination (/سینوس-لیفت-و-ایمپلنت-دندان) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 32: `/چرا-دندان-عقل-درد-میکند؟-دلایل-و-راه` → `/درد-دندان-عقل` (Destination (/درد-دندان-عقل) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 33: `/جراحی-زیبایی-بینی-راهنمای-کامل-عمل-بین` → `/جراحی-زیبایی-بینی` (Destination (/جراحی-زیبایی-بینی) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 34: `/جراحی-بازسازی-نواقص-صورت-بازگرداندن-ز` → `/جراحی-بازسازی-نواقص-صورت-بازگرداندن` (Destination (/جراحی-بازسازی-نواقص-صورت-بازگرداندن) is an old WordPress URL not present in LEGACY_REDIRECTS — not one of the 25 Phase-1 articles or structural pages. Likely a later-phase (P1/P2) post; adding a redirect now would point at a URL that itself 404s until a future phase migrates it.)
- id 35: `/european-nose-job-what-is-it-and-who-is-it-for` → `/european-nose-job` (Destination resolves cleanly to /fa/knowledge/european-nose-job, but the source itself is an English-locale-flavored alias — phase 1 is Persian-only (see knowledge/page.tsx's doc-comment). Deferred, not blocked.)
