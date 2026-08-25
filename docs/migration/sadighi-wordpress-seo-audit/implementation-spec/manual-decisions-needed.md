# Manual Decisions Needed Before Implementation

Every item below blocks part of the phase-1 rollout — either a specific redirect rule (`legacy-redirects-spec.csv` rows marked `P0-blocked`) or the Knowledge Center data-layer work itself. None of these should be silently decided in code; each needs an explicit call from Hamid (or Dr. Sadighi, where it's a content/medical judgment).

## 1. `/بلفاروپلاستی/` — two Persian posts collide on one URL

**Current issue:** post_ids 7168 and 7212 are both published WordPress posts titled "بلفاروپلاستی" that resolve to the exact same live permalink. Only one has ever actually been reachable at a time.

**SEO risk:** the 17 clicks / 9,481 impressions Search Console attributes to this URL cannot be split between the two posts — migrating the wrong one risks losing whatever ranking signal actually accrued to the version Google has been crawling.

**Options:**
- (a) Canonicalize on post_id 7212 (newer — modified 2023-12-23 vs. 7168's 2023-12-21 — and richer: 13,298 chars with Elementor content vs. 7168's 9,137 chars, no Elementor).
- (b) Canonicalize on post_id 7168 instead.
- (c) Merge both into one article, keeping any unique content from 7168 that 7212 doesn't cover.

**Recommended decision:** (a), per `collision-review.md`'s analysis — 7212 is both the more recent and the more substantial version. Before implementing, someone should actually read 7168 once to confirm it isn't carrying a materially different angle (e.g. a patient-story framing 7212 lacks) worth folding in under option (c) instead of discarding outright.

**Consequence if ignored:** shipping without a decision means either guessing which post's content to migrate (risking the wrong one) or leaving `/fa/knowledge/بلفاروپلاستی` unpublished while its 301 sits blocked — either delays this article past launch or migrates content that may not be the one actually earning the existing rankings.

---

## 2. `/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی/` — NOT a duplicate, a bilingual pair

**Current issue:** post_ids 8597 (Persian) and 13413 (English, "25 frequently asked questions about fat injection surgery") were published at the **identical timestamp** and share the same Persian slug — the English post never got its own URL and silently inherited the Persian one.

**SEO risk:** this URL carries real traffic (101 clicks, 1,558 impressions). Treating it as a simple duplicate-and-discard would throw away a real, distinct piece of English content rather than fixing the actual bug (a missing slug).

**Options:**
- (a) Keep 8597 (Persian) at the Persian URL; give 13413 its own English slug once the `/en` locale content rollout is scoped (`docs/adr/0005-locale-rollout-en-ar.md`).
- (b) Keep 8597 at the Persian URL; drop 13413 entirely (English content discarded).
- (c) Hold the whole URL in `needs-manual-review` until the `/en` rollout is scoped, rather than deciding now.

**Recommended decision:** (a) for the Persian side specifically — migrate 8597 now, it's unambiguous. The English side doesn't need to block phase 1: (c) for 13413 is fine short-term (it isn't costing anything to leave undecided since the current site has no `/en` FAQ content parity anyway), as long as it isn't accidentally deleted in the process.

**Consequence if ignored:** if this gets treated as a same-topic duplicate and only one post's existence is acknowledged, the English post's content is likely to be silently lost rather than deliberately shelved — small loss today, but the same silent-inheritance bug will keep recurring for any other bilingual pair already in the 185-item backlog if the root cause isn't flagged.

---

## 3. High-traffic tag archive redirects

**Current issue:** WordPress tag-archive URLs have no equivalent on the new site (no tag/category browsing UI exists in the Knowledge Center as scoped). Two carry meaningful traffic:

| URL | Clicks | Impressions | Status |
|---|---|---|---|
| `/tag/متخصص-دندان-تبریز/` | 383 | 551 | **Unresolved** — "دندان‌پزشک متخصص در تبریز" is too broad a term to map to one of the 8 core-service topics confidently. |
| `/tag/جراحی-ایمپلنت-تبریز/` | 308 | 328 | Tentatively resolved → `/fa/services/advanced-dental-implant` (single clear keyword match: "ایمپلنت"). |

**SEO risk:** 383 clicks is larger than all but 2 of the 30 P0-LAUNCH article URLs — losing this without a redirect is a bigger single loss than most of the article migrations combined.

**Options for `/tag/متخصص-دندان-تبریز/`:**
- (a) Redirect to the homepage (`/fa`) as a generic "dental specialist" catch-all.
- (b) Redirect to `/fa/about` (the term is closer to "which doctor" than "which procedure").
- (c) Redirect to a new general-dental Knowledge Center hub, if/when one exists.
- (d) Leave unredirected (404) if the traffic is judged incidental/branded rather than intent-driven.

**Recommended decision:** (b) — the query intent ("متخصص دندان تبریز" = "dental specialist [in] Tabriz") is closer to "who is this doctor" than to any single procedure; `/fa/about` is the existing page that answers that, and it's a real destination today, not a placeholder. **This is explicitly a fallback, not a confident topic match** — per the brief's own rule, "do not recommend homepage redirects unless there is truly no better match," and `/fa/about` is a better match than the homepage here even though it isn't a perfect one.

**For `/tag/جراحی-ایمپلنت-تبریز/`:** confirm the tentative `advanced-dental-implant` service-page redirect — this one has a clean single-keyword match and is low-risk to approve as-is.

**Consequence if ignored:** the higher-traffic of the two tag archives (383 clicks) is exactly the kind of URL the brief says not to silently drop — shipping without a decision here is a direct violation of "do not recommend homepage redirects unless there is truly no better match" if it defaults to `/fa` unreviewed.

---

## 4. Ambiguous high-traffic articles

**`جراحی برجستگی پیشانی`** ("forehead prominence surgery," 78 clicks, 7,312 impressions) — doesn't map cleanly onto any of the 8 core-service topics or an existing service page.

- **SEO risk:** meaningful traffic (7,312 impressions puts it above 24 of the 30 P0-LAUNCH URLs) with no confident destination.
- **Options:** (a) migrate as its own Knowledge Center article under `facial-cosmetic-surgery`/`facial-trauma-surgery` (forehead-contour procedures border both); (b) fold as a subsection into the existing `facial-cosmetic-surgery` service page; (c) read the actual WordPress content first to determine which procedure it really describes before deciding.
- **Recommended decision:** (c) first, then most likely (a) — the topic (forehead osteotomy/contouring) is specific enough to be its own article once its real medical content is read, similar in shape to the other 23 phase-1 articles.
- **Consequence if ignored:** left in `needs-manual-review` indefinitely, this either 404s at cutover or gets a rushed, possibly wrong redirect target.

**`نمونه درمان`** ("treatment sample," 67 clicks, 3,337 impressions) — a generic title that gives no indication of the actual procedure without reading the content.

- **SEO risk:** similar traffic profile to the above; impossible to classify from metadata alone.
- **Options:** (a) read the content, retitle for clarity, and migrate as a proper article; (b) merge into whichever service page its actual case-study content matches; (c) treat as a before/after case study and route into the site's existing `/fa/before-after` page instead of the Knowledge Center.
- **Recommended decision:** read first — this title alone doesn't support a confident automatic call, and it's the kind of judgment only someone who can open the WordPress admin (or the raw WXR content) should make.
- **Consequence if ignored:** same risk profile as the forehead-surgery item above.

---

## 5. Host/protocol canonicalization scope

**Current issue:** `http://www.dralirezasadighi.com/` alone carries 72 clicks / 50,582 impressions — nearly matching the apex domain's own impression volume — and is not a WordPress post/page at all, so it never appeared in the original content audit.

**This one has a clear destination** (`/fa`), so it isn't blocked the way items 1-4 are — the open question is purely **implementation scope**: should the canonicalization rule match only the exact indexed string, or the full space of non-canonical host/scheme combinations (`https://www...`, `http://dralirezasadighi.com/...`, `http://www...`)?

**Recommended decision:** implement as a general rule (any request where host ≠ `dralirezasadighi.com` or scheme ≠ `https` redirects to the canonical `https://dralirezasadighi.com` equivalent) rather than a single hardcoded string match — Search Console only shows the one variant that happened to get indexed/crawled, not proof that it's the only variant that exists or ever will.

**Consequence if ignored:** a string-exact rule silently misses the other three host/scheme combinations, each capable of carrying its own separate (if smaller) chunk of traffic that would then 404 at cutover.

---

## 6. Knowledge Center data-model location (architectural, not content)

**Current issue:** `knowledge-article-model.md` recommends a new `src/content/knowledge-articles.ts` file rather than extending the current 3-article demo array inside `fa.ts`. This is a folder-structure/content-modeling decision, which CLAUDE.md's Standing CTO Directives require explaining and confirming before implementing, not deciding silently in the first PR.

**Options:** (a) new dedicated `content/knowledge-articles.ts` as recommended; (b) keep extending `fa.ts` directly, accepting a much larger dictionary file; (c) some other split not yet considered.

**Recommended decision:** (a) — see the full reasoning in `knowledge-article-model.md`.

**Consequence if ignored:** starting to code articles directly into `fa.ts` without this being confirmed risks a rework once the file's size becomes unwieldy, and sets an unreviewed precedent for how the remaining ~155 not-yet-scoped WordPress posts get modeled in later phases.
