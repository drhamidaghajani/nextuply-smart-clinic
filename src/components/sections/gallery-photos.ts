/**
 * Real gallery photo assets, keyed by `services.items[].id` (the
 * homepage's 6 marketing specialty categories — see
 * `case-gallery-section.tsx`'s doc-comment for the full provenance of
 * each photo). Extracted from that component so the `/before-after` page
 * can reuse the exact same real assets instead of duplicating the map or
 * inventing placeholder imagery.
 */
export const REAL_PHOTOS: Partial<Record<string, string>> = {
  "jaw-surgery": "/media/gallery/jaw-surgery.jpg",
  rhinoplasty: "/media/gallery/rhinoplasty.jpeg",
  "facial-cosmetic": "/media/gallery/facial-cosmetic.png",
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
  "jaw-surgery": "center 25%",
};
