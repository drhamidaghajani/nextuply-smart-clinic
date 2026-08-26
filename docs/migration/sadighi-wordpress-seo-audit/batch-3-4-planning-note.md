# Batch 3/4 Article Migration — Planning Note

Planning only, per the 2026-08-26 task scope. **No articles were migrated in this pass.** This note updates `remaining-article-migration-plan.csv` with Batch 2's final disposition and lists what's still open.

## Current state of the 107-post remaining scope

| Disposition | Count |
|---|---|
| Batch 2 — implemented (this round) | 29 source posts → 15 final articles |
| Pending Batch 3/4 | 55 |
| Pending business-relevance decision (general dentistry) | 11 |
| Approved: redirect to `/about`, not migrated ("why choose Dr. Sadighi") | 4 |
| Reserved for a future testimonials feature, not Knowledge articles | 4 |
| Do-not-migrate (confirmed junk/thin content) | 3 |
| Fixed redirect-only (wisdom-tooth mis-redirect) | 1 |

Full row-level detail is in `remaining-article-migration-plan.csv`, `merge-recommendations.csv`, `redirect-only-list.csv`, and `do-not-migrate-list.csv` (all updated as part of Batch 2's own commit).

## Groups still pending for Batch 3/4

Highest-signal remaining posts (by clicks), none yet assigned to a batch:

- Implant-topic cluster: dental implant training-course promo (37c — likely CME/professional audience, not patient-facing; needs a content-fit judgment before migrating as-is), generic installment-implant duplicate (25c, near-duplicate of the already-migrated Tabriz-specific article), implant complications (11c), Straumann implant guide (10c).
- `care-instructions`-cluster posts not yet folded into a dedicated care page: general dental-surgery overview (10c), sinus lift explainer (9c) — distinct from the already-migrated Batch 2 "Sinus Lift and Dental Implant" surgical explainer.
- Rhinoplasty: "What is rhinoplasty?" (9c), the already-redirect-fixed `جراحی-زیبایی-بینی` (7c, currently pointed at the generic rhinoplasty service page — a real dedicated article is a plausible Batch 3 candidate).
- Facial-cosmetic cluster: "types of facial cosmetic surgery" overview (9c), facial rejuvenation with fillers in Tehran/Tabriz (9c), a second botox FAQ (7c).
- Wisdom-tooth cluster: several near-duplicate posts on pain/timing/difference-from-extraction (up to 9c each) — closest existing match is Batch 1's `تفاوت-کشیدن-دندان-و-جراحی-دندان-عقل`; worth a consolidation pass similar to Batch 2's merge clusters rather than migrating each separately.
- TMJ/jaw-joint-sound topic (10c, currently `uncategorized` — needs a topic-cluster assignment).

None of these is individually large enough to justify per-post judgment in this note; a Batch 3 sizing pass (similar to the Batch 2 planning report) is the right next step when that work is scheduled.

## General dentistry — decision still pending

11 real posts (veneers, composite bonding, teeth whitening, dental bridge, mouthguard/bruxism, orthodontics timing, gummy smile, root canal) have no matching entry in `content/services.ts` — the site's current service taxonomy covers implants, orthognathic/jaw surgery, rhinoplasty, and facial cosmetic/reconstructive/trauma surgery, not general/restorative dentistry. Migrating these as Knowledge articles with no `serviceRelation` would mean orphan content with no natural site destination. This is a genuine content-strategy question (does the practice want a "general dentistry" educational pillar at all, even without a bookable matching service?), not a migration-mechanics one — unchanged from the original Batch 2 planning report, still unresolved.

## "Why choose Dr. Sadighi" — feeds About/trust blocks, not Knowledge articles

4 posts (`بهترین-جراح-فک-در-تبریز`, `چرا-دکتر-علیرضا-صدیقی-را-برای-جراحی-فک`, `مزایای-جراحی-فک-و-معرفی-بهترین-جراح-فک`, and the English `why-choose-dr-alireza-sedighi...`) are marketing/bio content, not clinical education — they currently redirect to `/about` (correct destination) and should stay there. If/when the `/about` page gets a dedicated trust-block or credentials section, this WordPress copy is the real source material to draw from — but that's an `/about` page content task, not a Knowledge Center migration, and is not scheduled in this note.

## Patient-testimonial stubs — feed the future Real Patient Stories feature, not Knowledge articles

4 posts (`رضایت-بیمار-از-جراحی-فک`, `رضایت-بیمار-از-جراحی-فک-بالا-و-پایین`, `رضایت-بیمار-پس-از-جراحی-بلفاروپلاستی`, `رضایت-بیمار-از-جراحی-بینی`) are 77–192-character patient-satisfaction stubs — too thin to be articles, and thematically they're testimonial material, not clinical guidance. If a genuine "Real Patient Stories" or testimonials feature is ever built (distinct from the homepage's now-redesigned `PatientStoriesSection`, which deliberately shows only real before/after cases, never patient quotes), this is where this content belongs — not as a Knowledge Center migration target.

## Not in scope for this note

Deep SEO rewrite, new content production, monthly Search Console reporting, and CMS/dashboard publishing remain separate contract scope, per the standing project understanding — this note is migration planning only.
