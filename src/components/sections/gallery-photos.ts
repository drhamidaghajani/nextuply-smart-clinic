/**
 * Real gallery photo assets, keyed by `services.items[].id` (the
 * homepage's 6 marketing specialty categories — see
 * `case-gallery-section.tsx`'s doc-comment for the full provenance of
 * each photo). Extracted from that component so the `/before-after` page
 * can reuse the exact same real assets instead of duplicating the map or
 * inventing placeholder imagery.
 */
export const REAL_PHOTOS: Partial<Record<string, string>> = {
  // Round 2026-08-28 (urgent visual rollback, per Hamid): the 2026-08-28
  // "wrong-gallery-image investigation" round briefly pointed this at
  // `doctor-surgery.jpg` after re-flagging the original photo as showing
  // an unrelated person. Hamid asked for that reverted as visually wrong
  // (a generic operating-room photo, repeated across the hero video
  // poster, the service hero, and this tile, was worse than the original)
  // — restored to the original file and crop exactly as it stood before
  // commit 3ff4fb4. See `case-gallery-section.tsx`'s doc-comment for the
  // full history of what this photo is and isn't confirmed to be.
  //
  // Round 2026-09-03 (image payload optimization): same photo, same crop —
  // `jaw-surgery.jpg` (1708x1920, 1.22MB) was already a JPEG, so format
  // conversion wasn't an option; re-saved as `jaw-surgery.optimized.jpg`,
  // resized to 1423x1600 (same aspect ratio, so `PHOTO_POSITION` below is
  // still valid unchanged) at quality 82 — 430KB, a 66% reduction, no
  // visible quality loss. Original `jaw-surgery.jpg` kept, unreferenced.
  "jaw-surgery": "/media/gallery/jaw-surgery.optimized.jpg",
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
  // Restored 2026-08-28 (urgent visual rollback) to the original crop,
  // tuned for this photo's framing — see `REAL_PHOTOS`'s own comment.
  "jaw-surgery": "center 25%",
};
