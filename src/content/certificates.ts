import type { Locale } from "@/i18n/locales";

/**
 * Dr. Sadighi's certificate/scientific-credential preview images, per
 * Hamid's 2026-07-14 "Certificates & Scientific Credentials" brief.
 *
 * Superseded an earlier version of this file that pointed at a
 * PDF+JPEG mix under nested `files/`/`thumbs/` subfolders — the folder
 * was replaced with a flat set of 14 pre-rendered preview images
 * (`public/media/certificates/certificate-N.png`, all `.png`, verified
 * by listing the folder directly, not assumed). `orientation` for every
 * item below is measured, not guessed (via `sips -g pixelWidth -g
 * pixelHeight` on each file): all 14 are portrait except certificate-13
 * (1080×763, landscape) — matches Hamid's brief exactly.
 *
 * Labels/alt text are intentionally generic per his explicit "use
 * generic labels for now" instruction, even though several of the
 * images are legible on inspection (Straumann/ITI World Symposium
 * certificates, an ITI Membership certificate, an i-FACE Congress
 * award, ITI Study Club Director confirmation, etc.) — those real
 * institution names/dates aren't reproduced here since translating them
 * into accurate fa/ar copy is a content decision, not a visual one, and
 * out of this task's scope.
 *
 * `featured` marks the 3 images used in the About page's hero
 * composition (chosen after visually inspecting all 14, not guessed):
 * certificate-1 (clean Straumann seal-badge design, portrait — reads
 * well as the large front card), certificate-5 (ITI Membership, minimal
 * white/wave design, portrait — clean second layer), and certificate-13
 * (i-FACE Congress, landscape, the most visually rich of the set — used
 * as the wide accent card per Hamid's own note that its landscape shape
 * suits a secondary card better than the main feature). The gallery
 * component treats the first `featured` item as the primary card and
 * the rest as the smaller layered cards.
 */

export type CertificateOrientation = "portrait" | "landscape";

export interface CertificateItem {
  id: string;
  imagePath: string;
  orientation: CertificateOrientation;
  label: Record<Locale, string>;
  alt: Record<Locale, string>;
  featured?: boolean;
}

const CERTIFICATE_ORIENTATIONS: Record<number, CertificateOrientation> = {
  1: "portrait",
  2: "portrait",
  3: "portrait",
  4: "portrait",
  5: "portrait",
  6: "portrait",
  7: "portrait",
  8: "portrait",
  9: "portrait",
  10: "portrait",
  11: "portrait",
  12: "portrait",
  13: "landscape",
  14: "portrait",
};

const FEATURED_CERTIFICATE_NUMBERS = new Set([1, 5, 13]);

function toPersianDigits(value: number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(value)
    .split("")
    .map((digit) => persianDigits[Number(digit)])
    .join("");
}

function toArabicIndicDigits(value: number): string {
  const arabicIndicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(value)
    .split("")
    .map((digit) => arabicIndicDigits[Number(digit)])
    .join("");
}

function certificateLabel(n: number): Record<Locale, string> {
  return {
    fa: `گواهی شماره ${toPersianDigits(n)}`,
    en: `Certificate ${n}`,
    ar: `الشهادة رقم ${toArabicIndicDigits(n)}`,
  };
}

function certificateAlt(n: number): Record<Locale, string> {
  return {
    fa: `گواهی علمی دکتر علیرضا صدیقی شماره ${toPersianDigits(n)}`,
    en: `Dr. Alireza Sadighi certificate number ${n}`,
    ar: `شهادة الدكتور علي رضا صديقي رقم ${toArabicIndicDigits(n)}`,
  };
}

export const CERTIFICATES: readonly CertificateItem[] = Array.from({ length: 14 }, (_, i) => i + 1).map(
  (n): CertificateItem => ({
    id: `certificate-${n}`,
    imagePath: `/media/certificates/certificate-${n}.png`,
    orientation: CERTIFICATE_ORIENTATIONS[n],
    label: certificateLabel(n),
    alt: certificateAlt(n),
    ...(FEATURED_CERTIFICATE_NUMBERS.has(n) ? { featured: true } : {}),
  })
);
