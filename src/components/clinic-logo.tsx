import Image from "next/image";

/**
 * Round 2026-07-11 (per Hamid — real logo asset now exists): replaces the
 * previous typographic-wordmark placeholder (gold accent bar + text)
 * entirely, per his explicit "Do not keep plain text if the PNG logo
 * exists." Real file: `public/media/gallery/dr-sadighi-logo.png` — note
 * the path, `media/gallery/`, not `images/logo/` (an earlier round's own
 * TODO comment pointed at the wrong path; corrected here to match where
 * the asset actually lives, per his explicit path correction).
 *
 * The PNG is a circular gold badge with genuine alpha transparency
 * (verified: `sips -g all` → `hasAlpha: yes`) — not a flattened white
 * square — so it's rendered plain, without any `rounded-full
 * overflow-hidden` clip container of our own (that would risk cropping
 * the badge's own edge if its circle doesn't touch the canvas edge
 * exactly). A soft `drop-shadow` is applied unconditionally as the
 * "subtle treatment" his brief asked for if contrast is ever poor: it's
 * naturally visible against light/cream backgrounds (where the badge's
 * internal white space could otherwise blend into the page) and
 * naturally near-invisible against dark navy/charcoal (where the gold
 * badge already reads fine on its own) — one rule, no light/dark
 * branching needed for it.
 *
 * `priority` defaults to false and should only be set `true` by the one
 * above-the-fold usage (Header) — the Footer's copy of this same
 * component must not compete for eager-load priority with it.
 *
 * Round 2026-07-11 (per Hamid): the subtitle's `max-w-[110px]` clamp was
 * forcing a 2-line wrap at some header widths — his explicit "دو خط نشه."
 * Removed in favor of `whitespace-nowrap`; safe now that callers pass a
 * short subtitle (Header's is 8 words → ~20 characters).
 *
 * Round 2026-07-12 (per Hamid): added `size` — Footer's badge should read
 * as 2x Header's ("دو برابر بشه"), not share one fixed size. `"sm"` (the
 * previous fixed 40/48px) stays Header's default; `"lg"` (80/96px) is
 * Footer's. Centering the badge within its own frame is the caller's job
 * (a `flex justify-center` wrapper), not this component's — it stays a
 * plain inline element so both Header's left-aligned-with-text lockup and
 * Footer's centered-alone placement both work without a layout prop here.
 */
export function ClinicLogo({
  tone = "dark",
  subtitle,
  size = "sm",
  priority = false,
  className,
}: {
  tone?: "dark" | "light";
  subtitle?: string;
  size?: "sm" | "lg";
  priority?: boolean;
  className?: string;
}) {
  const subtitleColor = tone === "light" ? "text-warm-white/55" : "text-charcoal/50";
  const imageSizeClass = size === "lg" ? "h-20 w-20 lg:h-24 lg:w-24" : "h-10 w-10 lg:h-12 lg:w-12";
  const imageSizesAttr = size === "lg" ? "96px" : "48px";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className={`relative block shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.18)] ${imageSizeClass}`}>
        <Image
          src="/media/gallery/dr-sadighi-logo.png"
          alt="دکتر علیرضا صدیقی"
          fill
          sizes={imageSizesAttr}
          priority={priority}
          className="object-contain"
        />
      </span>
      {subtitle ? (
        <span
          className={`whitespace-nowrap text-[10px] font-medium leading-snug tracking-[0.04em] transition-colors duration-300 ease-out sm:text-[11px] ${subtitleColor}`}
        >
          {subtitle}
        </span>
      ) : null}
    </span>
  );
}
