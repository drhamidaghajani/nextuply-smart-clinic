/**
 * Real gallery photo assets, keyed by `services.items[].id` (the
 * homepage's 6 marketing specialty categories — see
 * `case-gallery-section.tsx`'s doc-comment for the full provenance of
 * each photo). Extracted from that component so the `/before-after` page
 * can reuse the exact same real assets instead of duplicating the map or
 * inventing placeholder imagery.
 */
export const REAL_PHOTOS: Partial<Record<string, string>> = {
  // Round 2026-08-28 (wrong-gallery-image investigation, per Hamid): was
  // `/media/gallery/jaw-surgery.jpg` — a photo of an unrelated person (a
  // volleyball athlete holding a championship trophy and medal), not any
  // jaw-surgery/clinical content. An earlier code comment in
  // `case-gallery-section.tsx` recorded this photo as a confirmed real
  // patient back on 2026-07-15, but the visual content doesn't support
  // that, and the identical photo (different crop) had also been wired in
  // as this service's own hero photo in `services.ts` — treated as
  // confirmed-wrong per this investigation, flagged to Hamid in the report.
  // No other jaw-surgery/orthognathic photo exists in the project's media
  // (checked `public/media/**`), so rather than invent or reuse an
  // unrelated photo, this now points at the same real, already-approved
  // doctor/surgery photo (`doctor-surgery.jpg`) already used site-wide
  // (About page, hero poster, "Why Dr. Sadighi" section) as the general
  // fallback for "no dedicated photo" cases. Both `jaw-surgery.jpg` and
  // `orthognathic-surgery.png.jpeg` (the hero copy) are left in place,
  // unreferenced, per the standing "do not delete" convention.
  "jaw-surgery": "/media/doctor-surgery.jpg",
  rhinoplasty: "/media/gallery/rhinoplasty.jpeg",
  // Round 2026-08-27 (P0 production performance fix): was `facial-
  // cosmetic.png` — a 1.46MB PNG for a photograph at the exact same pixel
  // dimensions as `facial-rejuvenation.jpeg` (66KB) right above it. PNG's
  // lossless compression is the wrong format for a photo; re-saved as a
  // JPEG at the same quality this project already uses elsewhere (~85),
  // same visual content, 174KB — an 88% reduction. `facial-cosmetic.png`
  // itself is left in place, unreferenced, rather than deleted.
  "facial-cosmetic": "/media/gallery/facial-cosmetic.jpg",
  "dental-implant": "/media/gallery/dental-implant.jpeg",
  "impacted-tooth": "/media/gallery/impacted-tooth.jpeg",
  "facial-rejuvenation": "/media/gallery/facial-rejuvenation.jpeg",
  // Round 2026-08-20 — reuses the same hero photos wired to the service
  // detail pages' own hero (see `content/services.ts`'s `heroPhotoSrc`),
  // so this section's last two boxes stop falling back to the icon
  // placeholder, per Hamid's "همگی تصویر داشته باشند" follow-up.
  "facial-trauma": "/media/services/facial-trauma-surgery.png.jpeg",
  "facial-reconstruction": "/media/services/facial-reconstruction-surgery.png.jpeg",
};

/** Per-photo `object-position` override — defaults to "center" if unset. */
export const PHOTO_POSITION: Partial<Record<string, string>> = {
  // Matches the crop already used everywhere else `doctor-surgery.jpg`
  // appears (About page, "Why Dr. Sadighi" section) — the old "center 25%"
  // was tuned for the removed photo's framing, not this one.
  "jaw-surgery": "75% 25%",
};
