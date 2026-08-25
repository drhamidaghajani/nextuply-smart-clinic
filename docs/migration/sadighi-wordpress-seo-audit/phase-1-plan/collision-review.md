# Collision Review — Duplicate Live URLs

Two WordPress URLs each resolve to two different published posts (same permalink, different `post_id`). WordPress can only actually serve one of them on the live site at any given time. The two cases below turn out to have different root causes — one is a genuine duplicate Persian post, the other is a Persian/English translation pair that never got separate slugs — so each needs a different fix, not a single generic rule. Neither is something the migration script can resolve automatically; a human needs to confirm the call before either post is migrated.

## `https://dralirezasadighi.com/25-سوال-متداول-در-مورد-جراحی-تزریق-چربی/`

**Combined Search Console traffic for this URL:** 101 clicks, 1558 impressions, position 6.67 — attributed to whichever post Google actually crawled last; cannot be split between the two post_ids from GSC data alone.

| post_id | title | status | post_date | modified_date | content_length | has_content | has_elementor_content |
|---|---|---|---|---|---|---|---|
| 8597 | 25 سوال متداول در مورد جراحی تزریق چربی | publish | 2024-07-24 13:17:40 | 2024-08-08 14:29:56 | 4902 | True | False |
| 13413 | 25 frequently asked questions about fat injection surgery | publish | 2024-07-24 13:17:40 | 2024-08-08 14:27:37 | 5314 | True | False |

**Diagnosis: bilingual pair, not a true duplicate.** Both posts were published at the exact same timestamp (`2024-07-24 13:17:40`) — post_id 8597 is the Persian article, post_id 13413 is its English translation ("25 frequently asked questions about fat injection surgery"). The English post was never given its own slug and silently inherited the Persian one, so only one of the two has ever actually been reachable at this URL.

**Recommended canonical item for this URL: post_id 8597** (Persian) — this is the primary-market content and should keep the Persian slug.

**Recommended redirect/merge behavior:** migrate post_id 8597 into the Knowledge Center at the Persian URL. Do not discard post_id 13413 — it is real, distinct content — instead give it its own English-locale slug (e.g. under `/en/...`, consistent with the en/ar locale rollout in `docs/adr/0005-locale-rollout-en-ar.md`) rather than treating this as a canonical-vs-discard decision.

**Reason:** the identical publish timestamp across two different-language titles is a strong signal this came from a translation workflow (e.g. a multilingual plugin) that failed to assign the translated post its own slug, not from someone duplicating a Persian post.

---

## `https://dralirezasadighi.com/بلفاروپلاستی/`

**Combined Search Console traffic for this URL:** 17 clicks, 9481 impressions, position 8.18 — attributed to whichever post Google actually crawled last; cannot be split between the two post_ids from GSC data alone.

| post_id | title | status | post_date | modified_date | content_length | has_content | has_elementor_content |
|---|---|---|---|---|---|---|---|
| 7168 | بلفاروپلاستی | publish | 2023-12-21 20:26:27 | 2023-12-21 20:29:22 | 9137 | True | False |
| 7212 | بلفاروپلاستی | publish | 2023-12-22 13:43:37 | 2023-12-23 13:49:23 | 13298 | True | True |

**Most recently modified:** post_id 7212 (`2023-12-23 13:49:23`).
**Longer/richer content:** post_id 7212 (`13298` chars).

**Recommended canonical item: post_id 7212** — it is both the most recently modified and the more substantial version; treat it as the source of truth for the migrated article.

**Recommended redirect/merge behavior:** migrate post_id 7212's content into the Knowledge Center at the proposed URL; permanently retire post_id 7168 with no separate URL of its own (it never had one — same permalink).

**Reason:** WordPress permalinks are unique per post in normal operation — two posts sharing one exactly probably means one was originally created, then a second post was later given the same slug (e.g. through a copy/duplicate action, a translation plugin misconfiguration, or a manual slug edit) without the first being deleted or its slug freed up. Only one has actually been reachable on the live site at any given time; Search Console traffic reflects whichever version Google most recently crawled, not both.

---
