# CONTENT_INVENTORY.md

> Real content extracted from Dr. Sadighi's current live site ([dralirezasadighi.com](https://dralirezasadighi.com/)) on 2026-07-01, to seed the new platform's real content. This is factual/business data, not design direction — see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for the visual direction. Everything here needs client confirmation/refresh before final publish (flagged per item below) — nothing here should be treated as final copy.

## 1. Doctor Profile

- **Name**: Dr. Alireza Sadighi (b. 1368 / 1989)
- **Specialty**: Oral, maxillofacial, and facial surgery; fellowship in facial aesthetics and reconstruction, Tehran University of Medical Sciences
- **Practices in two cities**: **Tehran and Tabriz** — ⚠️ **architecture-relevant finding**: the clinic has (at least) two physical locations under one doctor/brand. See §5 below — this affects the data model.

## 2. Services (source: current nav + service pages)

**Aesthetic / cosmetic:**
- Blepharoplasty (eyelid surgery)
- Rhinoplasty
- Botox
- Filler injection / fat transfer
- Cheek implants
- Buccal fat removal
- Submental liposuction
- Brow / temple lift
- Facelift
- Facial defect reconstruction

**Oral & maxillofacial surgery** (a second, distinct service line — not just "cosmetic"):
- Dental implants
- Jaw surgery
- Wisdom tooth extraction
- Impacted tooth surgery

⚠️ **Product-scope note**: the current site treats aesthetic and dental/maxillofacial surgery as two service families under one practice. Decide explicitly whether the new platform's "Services" module models these as one flat catalog or two distinct service categories with different booking/consultation flows — recommend the latter, since patient intent and trust signals differ (dental-functional vs. aesthetic-elective).

## 3. Contact & Location

- **Phone**: 041-33334539 (Tabriz landline) · 09120149500 (mobile)
- **Address (Tabriz)**: Valiasr St., Rudaki Circle, Farid Building, 4th floor (next to Dr. Zarei pharmacy)
- **Tehran address**: not captured on current site — needs to be requested from the client.
- **Instagram**: [@dr.sadighi.alireza](https://www.instagram.com/dr.sadighi.alireza/)
- **Hours**: Sat–Wed 10:00–19:00, Thu 10:00–14:00, Fri closed

## 4. Trust Content Already In Hand

- 4+ visible patient testimonials (plain text, not yet on video)
- 6+ before/after case examples already exist on the current site — **candidate real source material for the new Before/After Slider component** (UI_GUIDELINES.md §5), pending image-rights/consent confirmation and re-shooting at higher resolution if needed for the premium bar.
- 4+ blog posts (surgical aftercare, implant guidance) — candidate seed content for the WordPress-headless blog module.
- FAQ section already exists — candidate seed content, needs re-review for tone/completeness.

## 5. Data-Model Implication (flagging a correction to DATABASE_GUIDE.md)

DATABASE_GUIDE.md's entity list did not originally separate "Clinic" from "Location" because the assumption going in was one clinic = one address. **That assumption is wrong** for the real client: Dr. Sadighi operates in both Tehran and Tabriz. Recommendation (see the corresponding edit made in DATABASE_GUIDE.md): add a `Location` entity under `Clinic` (address, hours, phone, map coordinates), and scope `Appointment` to a `locationId` in addition to `clinicId` — this is exactly the kind of single-tenant-but-still-correctly-modeled decision the tenancy strategy is meant to protect against having to redo later, and it would have mattered even before multi-clinic SaaS existed, since this one real client already needs it.

## 6. Current Site's Design Baseline (what we are explicitly moving away from)

- White background, teal/turquoise accents, clean-but-dated sans-serif typography.
- "Functional, informative clinic site typical of 2023–2024 Iranian medical practices — serviceable but lacking premium polish, modern micro-interactions, or sophisticated visual hierarchy."
- Almost entirely Persian; English limited to a few menu labels — full `en`/`ar` builds are genuinely new work, not translation of a handful of strings.

This baseline is the concrete, real-world confirmation of the brief: "این پروژه نباید شبیه هیچ سایت پزشکی ایران باشد."

## 7. Outstanding Content Gaps (need from the client before build)

- Tehran clinic address/hours (if it's a currently active second location).
- High-resolution real photography: doctor portrait(s), clinic interior, and before/after sets shot to the standard needed for the Before/After Slider centerpiece (the current site's image quality is "moderate" — will not clear the premium bar as-is).
- ~~Real brand assets (logo, any existing color/typography preference)~~ — **resolved 2026-07-01**: final color palette supplied and locked in DESIGN_SYSTEM.md §2 (cream/gold/charcoal/deep-navy). Logo file itself is still needed for the header/favicon.
- English/Arabic content for the medical-tourism track (VISION.md's three-locale requirement), deferred per `docs/adr/0002-fa-first-locale-scope.md` — Hamid will send this once the Persian site's structure/content is finalized, not needed for the current build phase.

## 8. Asset Intake Spec (Hero Video + Before/After Photos)

Requested by Hamid 2026-07-01. Exact folder paths below match `public/` in FOLDER_STRUCTURE.md — these folders are created empty (with a `.gitkeep`) as part of the initial project scaffold so assets can be dropped in directly.

### Hero video

- **Where to put it**: `public/media/source/hero-doctor-source.mp4` (a `source/` subfolder is used for original, unoptimized uploads — the build pipeline/optimization step reads from here and produces the actual served files; never point a page directly at a `source/` file).
- **Format**: MP4 (H.264) is fine as the source; we will transcode to a compressed MP4 + WebM pair for the actual Hero background.
- **Resolution**: 1920×1080 minimum; 3840×2160 (4K) preferred if available, source footage will be downscaled as needed — don't pre-compress before sending, send the highest-quality original.
- **Duration**: a 10–20 second segment that loops cleanly (or can be trimmed to one) works best for a Hero background per HOMEPAGE_STORYBOARD.md §2's "01 — Hero" — if the raw video is longer, that's fine, tell us which portion (timestamp range) is the intended Hero segment, or we'll select the strongest 10–20s ourselves and confirm with you before finalizing.
- **Orientation**: landscape (16:9) for desktop Hero; if a vertical/portrait version exists too, send it separately (`hero-doctor-source-vertical.mp4`) for the mobile Hero treatment — otherwise we'll crop the landscape version for mobile.

### Before/After photos

- **Where to put them**: `public/media/source/before-after/<procedure-slug>/`, one subfolder per procedure, e.g. `public/media/source/before-after/rhinoplasty/`, `.../blepharoplasty/`, `.../facelift/`.
- **Naming inside each folder**: `case-01-before.jpg`, `case-01-after.jpg`, `case-02-before.jpg`, `case-02-after.jpg`, etc. — sequential case numbers, consistent `before`/`after` suffix so the app can pair them automatically.
- **How many**: **minimum 3 cases per procedure**, for the 2–3 procedures we lead with on the Homepage Before/After Gallery (recommend starting with the practice's strongest results — likely rhinoplasty and blepharoplasty per current site's emphasis, see §2 above). More is better for the full Gallery page later, but 3 well-shot pairs beats 6 mediocre ones for the Homepage's premium bar.
- **Technical spec per photo**: minimum 2000px on the longer edge, JPG or PNG (we'll convert to optimized WebP/AVIF at build time — send the highest quality original, don't pre-compress); before/after pairs shot at the **same angle, distance, lighting, and background** — this consistency matters more than resolution for the slider to look credible and premium.
- **Consent**: only send cases with documented patient consent for public marketing use — this gets flagged again in DATABASE_GUIDE.md's `MediaAsset` entity (consent metadata field), but the responsibility for having consent in hand starts here.
