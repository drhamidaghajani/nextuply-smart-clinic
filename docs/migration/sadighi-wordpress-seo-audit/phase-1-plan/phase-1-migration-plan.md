# Dr. Sadighi WordPress → Knowledge Center — Phase-1 (Launch-Safe) Migration Plan

Second-stage refinement of the stage-1 audit (`../migration-map-draft.csv`, `../search-console-url-performance.csv`, `../wordpress-content-inventory.csv`, `../migration-summary.md`). Planning only — no Next.js code, routes, or redirects were created or modified.

## Executive summary

The stage-1 audit flagged 160 of 185 WordPress posts/pages as "P0" using a broad rule (any core-topic content with usable text qualified). That was too permissive to act on directly — it's not a launch checklist, it's most of the site. This stage narrows that down to a genuinely launch-blocking set: **30 URLs** selected by actual traffic (clicks first, then impressions) plus a small number of structurally mandatory pages (homepage, about, contact) and the two known URL collisions, which are force-included specifically so they can't be silently skipped.

Everything selected already has **"strong" content quality** in the WordPress export (real `content:encoded` text, not just Elementor JSON or a thin stub) — no thin/placeholder content made it into this list on traffic alone, matching the brief's instruction to exclude thin/duplicate/ambiguous pages unless they carry strong traffic.

## Final P0-LAUNCH count: 30 URLs

- 23 → `migrate-to-knowledge-center`
- 4 → `needs-manual-review` (2 URL collisions + 2 topically ambiguous but high-traffic pages)
- 2 → `redirect-to-home-or-about` (`/contact/`, `/about-us/`)
- 1 → `keep-same-url` (homepage)

Notably, **none of the 30 launch-critical URLs resolved to `redirect-to-service-page` or `redirect-to-knowledge-article`.** Every article that made the traffic cut also has enough original content to justify becoming a standalone Knowledge Center article rather than being folded into a service page — the service pages absorb *supporting/thin* content (see stage-1 `merge-into-service-page` rows), not the high-traffic ones.

## Top 10 must-protect URLs

| # | Clicks | Impressions | URL | Action |
|---|---|---|---|---|
| 1 | 8,073 | 50,464 | `https://dralirezasadighi.com/` | `keep-same-url` → becomes the new homepage at `/fa` |
| 2 | 2,753 | 17,354 | `.../ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا/` | `migrate-to-knowledge-center` |
| 3 | 1,599 | 57,539 | `.../جراحی-فک-نی-نی-سایت/` | `migrate-to-knowledge-center` |
| 4 | 530 | 12,515 | `.../جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا/` | `migrate-to-knowledge-center` |
| 5 | 424 | 7,182 | `.../جراحی-دندان-عقل-با-بیهوشی-در-تبریز/` | `migrate-to-knowledge-center` |
| 6 | 396 | 5,087 | `.../فیزیوتراپی-بعد-از-جراحی-فک-راهنمای-کام/` | `migrate-to-knowledge-center` |
| 7 | 371 | 15,849 | `.../فیلم_جراحی_فک_در_اتاق_عمل/` | `migrate-to-knowledge-center` |
| 8 | 368 | 13,789 | `.../25-سوال-متداول-در-مورد-جراحی-لیفت-ابرو-و-ش/` | `migrate-to-knowledge-center` |
| 9 | 286 | 19,515 | `.../بهترین-متخصص-ایمپلنت-تبریز-و-معرفی-دکت/` | `migrate-to-knowledge-center` |
| 10 | 204 | 20,589 | `.../contact/` | `redirect-to-home-or-about` → `/fa/contact` |

Full 30-row detail (including `about-us/`, the two collisions, and 20 more core-topic articles) is in `p0-launch-list.csv`.

## What should migrate as full Knowledge Center articles (23 URLs)

Every non-structural, non-collision, non-ambiguous URL in the launch list — spanning all core topics with real traffic:

- **advanced-dental-implant** (5): ایمپلنت اقساطی، بهترین متخصص ایمپلنت، ایمپلنت فوری، ایمپلنت دندان پرسش‌وپاسخ، ایمپلنت اشترومن
- **orthognathic-surgery** (9): جراحی فک نی‌نی‌سایت، فیزیوتراپی بعد از جراحی فک (×2 variants), فیلم جراحی فک در اتاق عمل، ریلپس بعد از جراحی فک، جراحی فک پایین عقب‌رفته/جلوآمده، ۲۵ سوال چانه و زاویه‌سازی فک
- **rhinoplasty** (3): جراحی بینی اروپایی، european-nose-job، ۲۵ سوال زیبایی بینی
- **impacted-tooth-surgery** (3): جراحی دندان عقل با بیهوشی، ۲۵ سوال دندان عقل نهفته، تفاوت کشیدن دندان و جراحی دندان عقل
- **facial-cosmetic-surgery** (3): ۲۵ سوال لیفت ابرو و شقیقه، لیفت شقیقه گلایدینگ، لیفت ابرو و شقیقه، ۲۵ سوال تزریق فیلر

Each of these needs: (1) a Knowledge Center slug — see slug recommendation below — (2) the article content re-authored/cleaned from the WordPress export (not a raw HTML dump — see Content quality issues in `../migration-summary.md`), (3) fresh `rank_math_title`/`rank_math_description`-equivalent metadata where the export had none.

## What should redirect to existing service pages

**None, in this launch-critical set.** Stage-1's `redirect-to-service-page` and `merge-into-service-page` actions apply to shorter/duplicative WordPress posts (see `../migration-map-draft.csv`) — none of those crossed the traffic/topic bar to make it into the 30-URL launch list. This is a real finding, not an omission: the site's real search-traffic-earning content is substantial enough to stand on its own, and the service pages should be linked *from* these articles rather than absorbing them.

If a hard deadline forces a smaller phase-1 scope, the safest URLs to defer past launch (lowest click count in the current 23) are: ایمپلنت اشترومن (63 clicks), ایمپلنت دندان پرسش‌وپاسخ (66), جراحی فک پایین جلوآمده (67), جراحی فک پایین عقب‌رفته (71) — these still warrant a redirect eventually, just not before domain cutover.

## What should redirect to care-instruction pages

**None, directly, in this launch-critical set** — the one care-instructions-topic URL in the list (`25-سوال-متداول-در-مورد-جراحی-تزریق-چربی`) is a **collision** (see below) and is withheld pending manual resolution rather than auto-redirected. Once resolved, it should redirect to `/fa/care-instructions/` (no exact existing sub-page matches "fat injection" specifically — closest is the general care-instructions index, or migrate it as its own Knowledge Center article if content quality supports it; this is itself a manual call, see `collision-review.md`).

## What needs manual review before implementation (4 URLs)

1. **`/بلفاروپلاستی/`** — two Persian posts (post_ids 7168, 7212) genuinely collide on the same URL. See `collision-review.md`: recommend canonicalizing on post_id 7212 (newer, richer, has Elementor content) and retiring 7168.
2. **`/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی/`** — NOT a true duplicate: post_ids 8597 (Persian) and 13413 (English) were published at the identical timestamp — a translation pair that never got separate slugs. Recommend keeping 8597 at the Persian URL and giving 13413 its own `/en/...` slug as part of the future locale rollout, not discarding it.
3. **`/جراحی-برجستگی-پیشانی/`** ("forehead prominence surgery," 78 clicks, 7,312 impressions) — doesn't map cleanly onto any of the 8 named core-service topics or an existing service page; likely a facial-cosmetic-surgery sub-topic, but the current site has no "forehead" specific procedure page. Needs a human call on whether it becomes its own Knowledge Center article or gets folded into `facial-cosmetic-surgery`.
4. **`/نمونه-درمان/`** ("treatment sample," 67 clicks, 3,337 impressions) — title is a generic label, unclear what specific procedure(s) it documents without reading the full content. Needs a manual read before deciding a migration target.

## SEO risks before launch

- **No literal same-URL preservation is possible anywhere.** Confirmed in `src/middleware.ts`: bare paths are always redirected to a visible `/fa/...` prefix, and none of the ~536 WordPress URLs already carry that prefix. Every one of the 30 launch URLs needs an explicit redirect rule, including the highest-traffic ones — there is no path that survives byte-for-byte.
- **`http://www.dralirezasadighi.com/` carries 72 clicks and 50,582 impressions of its own** — nearly matching the apex domain's impression volume — and does **not** appear in the WordPress export at all (it's a host/protocol canonicalization artifact tracked separately by Search Console). This must be redirected (www + http → the canonical `https://dralirezasadighi.com/fa`) or a huge chunk of impression volume silently vanishes at cutover. See `unmatched-gsc-priority.csv`.
- **Two `/tag/...` archive URLs carry meaningful traffic** on their own: `/tag/متخصص-دندان-تبریز/` (383 clicks, 551 impressions) and `/tag/جراحی-ایمپلنت-تبریز/` (308 clicks, 328 impressions). WordPress tag archives have no Knowledge Center equivalent — both need an explicit redirect decision (see `unmatched-gsc-priority.csv`), not a silent 404, given the click volume involved.
- **The two URL collisions mean Search Console traffic numbers for those two URLs cannot be trusted as belonging to a single piece of content** — whichever post Google most recently crawled is getting credit for both. Resolving the collision may reveal the "real" canonical post performs differently than the combined number suggests.
- **Rank Math metadata is missing for the majority of published content** (`../migration-summary.md`: 131 of 185 published items have no `rank_math_title`) — none of the 30 launch URLs can be assumed to have reusable meta titles/descriptions; budget time to author these fresh rather than copy them.

## Implementation notes for Next.js redirects

- **Do not implement redirects before the destination exists.** A 301 to a Knowledge Center article that hasn't been written yet just turns a 404 into a broken-looking redirect loop/soft-404. Sequence: (1) author each article/page at its `proposed_next_url`, (2) add the redirect rule, (3) verify with a spot-check pass across all 30 URLs before DNS/domain cutover.
- **Redirect resolution must happen before the locale-prefix redirect, not after.** `src/middleware.ts` already redirects any bare (non-`/fa`, `/en`, `/ar`) path to `/${DEFAULT_LOCALE}${pathname}` (line ~155). If a legacy WordPress path is simply left to fall through to that rule, it becomes `/fa/<old-persian-slug>`, which won't exist and 404s — a second hop that also throws away the SEO signal from the original redirect. The legacy-URL lookup needs to run *before* that generic locale-prefix rule and redirect straight to the final destination in a single hop.
- **Recommend a data-driven lookup, not a hardcoded array.** Given the existing `middleware.ts` already has this shape of logic (see its internal-route guard), the cleanest fit is a small lookup table (e.g. `src/content/legacy-redirects.ts`, a `Record<string, string>` of old path → new path) consulted early in middleware, rather than Next's static `redirects()` config in `next.config.ts`. A static config array works fine for 30 entries, but this list will grow across later phases (the P1/P2 backlog, the ~65 unmatched Search-Console URLs) — a data file that middleware reads is easier to extend without touching routing config, and keeps the redirect map reviewable as its own diff.
- **All redirects should be permanent (301-equivalent).** In middleware, `NextResponse.redirect(url, 308)` (or Next's `redirects()` with `permanent: true`) — 308 preserves the request method and is the modern equivalent of a 301 for this purpose; either is acceptable to Google, but treat every one of these as permanent, never temporary.
- **This is a launch gate, not a follow-up.** Per the brief: assume old WordPress URLs will 404 without an explicit rule — there is no automatic fallback that saves an un-mapped high-traffic URL.

## Recommendation: Persian vs. English slugs

**Preserve the existing Persian slug text for every URL in this launch list**, reusing it verbatim as the new Knowledge Center article's slug (e.g. `/fa/knowledge/ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا`) rather than transliterating or translating to English. Reasoning:

- These exact Persian slugs are what's currently ranking and earning the clicks/impressions in this report — the keyword text is baked into the URL and almost certainly contributes to relevance signal for the Persian queries this clinic depends on (confirmed by the top Search Console queries being Persian phrases, not English ones).
- The brief's own instruction is explicit: preserve Persian slugs for high-value Persian SEO URLs unless there's a strong reason not to — nothing in this data suggests a reason to deviate for the launch set.
- The one place English slugs are already in play — `european-nose-job` (currently ASCII) and the bilingual FAQ pair — should stay as-is/be resolved on their own terms (see collision review) rather than having the rule "always transliterate to English" applied uniformly; a blanket policy either direction would fight the data.
- Where a WordPress slug is auto-generated and not human-meaningful (`elementor-6252`, `?page_id=8`), it is **not** in this launch list, so no Persian-slug-preservation conflict arises here — those get a newly authored descriptive Persian slug when they're migrated in a later phase, per stage-1's `migration-map-draft.csv` notes.
- English-locale content (the `/en/...` pages surfaced in `unmatched-gsc-priority.csv`, and the English half of the FAQ collision) should get its own English slugs under the `/en` locale prefix once that locale's content rollout matures (`docs/adr/0005-locale-rollout-en-ar.md`) — not Persian slugs with an English title bolted on, which is the exact bug that caused the collision in the first place.
