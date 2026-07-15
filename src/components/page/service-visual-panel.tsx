import Image from "next/image";

/**
 * A service's visual panel — a real photo when one exists (`photoSrc`,
 * from `gallery-photos.ts`'s `REAL_PHOTOS`/the doctor's own real
 * portrait/OR photography — never a stock or fabricated medical image),
 * or a premium abstract gradient + line-art glyph panel when it doesn't.
 * Used inside `ServiceSplitStory` and the hero — one visual language for
 * "the non-text side of an editorial block" across the service page.
 */
export function ServiceVisualPanel({
  photoSrc,
  alt,
  iconKey,
  photoPosition = "center",
  tone = "cream",
}: {
  photoSrc?: string;
  alt: string;
  /** Used only for the abstract fallback's masked glyph — `/icons/services/<iconKey>.png`. */
  iconKey?: string;
  photoPosition?: string;
  tone?: "cream" | "navy";
}) {
  if (photoSrc) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:rounded-[28px]">
        <Image src={photoSrc} alt={alt} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" style={{ objectPosition: photoPosition }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-warm-white/10" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl sm:rounded-[28px] ${
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
