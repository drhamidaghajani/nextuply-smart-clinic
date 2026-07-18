import Image from "next/image";

/**
 * A service's visual panel — a real photo when one exists (`photoSrc`,
 * from `gallery-photos.ts`'s `REAL_PHOTOS`/the doctor's own real
 * portrait/OR photography — never a stock or fabricated medical image),
 * or a premium abstract gradient + line-art glyph panel when it doesn't.
 * Used inside `ServiceSplitStory` and the hero — one visual language for
 * "the non-text side of an editorial block" across the service page.
 *
 * Round 2026-07-18 (hero image cropping fix, per Hamid — the service
 * detail hero was rendering wide landscape source photos, e.g. the
 * impacted-tooth diagram at ~2.5:1, inside this component's portrait
 * `aspect-[4/5]` + `object-cover` frame, which crops most of the width
 * off to fill the narrow frame). `aspectRatio`/`fit` are now caller-
 * controlled, defaulting to the ORIGINAL portrait/cover behavior so the
 * two `ServiceSplitStory` doctor-photo panels and the care-instructions
 * grid (headshot/OR photography, genuinely fine as portrait crops) are
 * unaffected — only `ServiceHero` opts into the landscape/contain frame.
 */
export function ServiceVisualPanel({
  photoSrc,
  alt,
  iconKey,
  photoPosition = "center",
  tone = "cream",
  aspectRatio = "aspect-[4/5]",
  fit = "cover",
}: {
  photoSrc?: string;
  alt: string;
  /** Used only for the abstract fallback's masked glyph — `/icons/services/<iconKey>.png`. */
  iconKey?: string;
  photoPosition?: string;
  tone?: "cream" | "navy";
  /** Tailwind aspect-ratio class for the frame, e.g. `"aspect-[16/10]"`. */
  aspectRatio?: string;
  /** `"contain"` shows the full source image (letterboxed on a soft frame background) — required for diagram-like images where `"cover"` would crop off content. */
  fit?: "cover" | "contain";
}) {
  if (photoSrc) {
    return (
      <div
        className={`relative ${aspectRatio} w-full overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:rounded-[28px] ${
          fit === "contain" ? "bg-gradient-to-br from-warm-white to-cream" : ""
        }`}
      >
        <Image
          src={photoSrc}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className={fit === "contain" ? "object-contain p-4 sm:p-6" : "object-cover"}
          style={fit === "contain" ? undefined : { objectPosition: photoPosition }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-warm-white/10" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex ${aspectRatio} w-full items-center justify-center overflow-hidden rounded-2xl sm:rounded-[28px] ${
        tone === "navy" ? "bg-gradient-to-br from-deep-navy to-[#1a2540]" : "bg-gradient-to-br from-warm-white to-cream"
      }`}
    >
      <div
        aria-hidden
        className={`animate-ambient-light absolute -top-10 start-1/4 h-[220px] w-[220px] rounded-full blur-[90px] ${tone === "navy" ? "bg-gold/20" : "bg-gold/15"}`}
      />
      {iconKey ? (
        <span
          aria-hidden
          className={`relative block h-20 w-20 shrink-0 sm:h-28 sm:w-28 ${tone === "navy" ? "bg-warm-white/25" : "bg-charcoal/10"}`}
          style={{
            WebkitMaskImage: `url(/icons/services/${iconKey}.png)`,
            maskImage: `url(/icons/services/${iconKey}.png)`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      ) : null}
    </div>
  );
}
