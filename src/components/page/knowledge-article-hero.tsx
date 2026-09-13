import Image from "next/image";

import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

export interface KnowledgeArticleHeroMedia {
  src: string;
  alt: string;
  /** Intrinsic dimensions when known — the figure then keeps its true ratio. */
  width?: number;
  height?: number;
}

/**
 * The Knowledge article's hero figure (2026-09-13 editorial-shell redesign).
 *
 * Extracted from the retired `KnowledgeArticleMasthead` so the same media can
 * be rendered by the two placements the redesigned shell needs without
 * forking the ratio logic: in the mobile flow (between the article lead and
 * the body) and inside the desktop rail. The two instances are mutually
 * exclusive per breakpoint — the flow one is `lg:hidden`, the rail one is
 * `hidden lg:block` — so exactly one of them has a layout box and is painted,
 * and the hidden one never triggers a fetch of its own.
 *
 * `priority` is therefore passed to BOTH instances: each is the above-the-fold
 * LCP candidate at its own breakpoint, and the `<img>` that has no box cannot
 * be the LCP. Because the two share a `src` and a `sizes` value, the preload
 * they emit is byte-identical, so the browser resolves it to a single fetch
 * rather than two.
 *
 * Ratio contract (deliberately unchanged from the masthead):
 * - `width`+`height` known → true aspect ratio at a capped width. This is
 *   what lets S Lift's portrait `after.jpg` (1051×1497) render as an honest
 *   portrait rather than a 16:9 crop, and it is WHY the redesigned shell can
 *   give the hero its own rail: the rail's figure box is 302px wide at
 *   ≥1024px, so the portrait renders 302×430 and its height no longer
 *   dictates when the article body starts (measured on the production build:
 *   the body's first paragraph begins 24px below the H1 on all three
 *   locales). Below 481px this branch caps at 272px instead of 320px (see
 *   `figureWidthClass`).
 * - dimensions unknown → the pre-2026-09-13 articles keep their original
 *   16:9 cover treatment instead of a guessed ratio.
 */
export function KnowledgeArticleHero({
  hero,
  locale,
  className,
  priority = false,
}: {
  hero: KnowledgeArticleHeroMedia;
  locale: Locale;
  className?: string;
  /** Set on both placements — see the note above on why that is safe. */
  priority?: boolean;
}) {
  const hasIntrinsicSize = Boolean(hero.width && hero.height);

  /*
    Small-mobile refinement (2026-09-14): at 320px the portrait hero's frame is
    390px tall (272px inside it), so the reader had to scroll roughly a full
    screen past the image before reaching the first paragraph. The cap is
    branch-scoped on purpose:
    - intrinsic ratio → 272px below 481px (the top of the band the brief
      allows), leaving a 254px image that still reads as a clinical photograph
      rather than a thumbnail.
    - 16:9 legacy covers → unchanged. They are already short (188px at 390px),
      so shrinking them would cost detail and buy no scroll.
    `sizes` follows the same split and must stay branch-honest: the legacy
    branch has to keep advertising 320px, or the 40 cover articles would start
    fetching images too small for their box.

    Note on the desktop rail: this figure is capped at 320px at EVERY
    breakpoint, the 352px rail included, so the rail renders the same 302px
    image as the flow copy. That is the approved desktop rendering and it is
    deliberately not widened here. The attribute previously carried a
    hypothetical lg-only cap at 380px that never actually took effect — it sat
    inside the template literal with no separating boundary before the
    interpolation, and Tailwind's scanner reads such a token as invalid, so no
    rule was ever emitted for it. It is now removed rather than repaired,
    precisely because repairing it would enlarge the approved rail hero.
  */
  const figureWidthClass = hasIntrinsicSize ? "max-w-[320px] max-[480px]:max-w-[272px]" : "max-w-[320px]";
  const heroSizes = hasIntrinsicSize
    ? "(min-width: 1024px) 380px, (min-width: 481px) 320px, 272px"
    : "(min-width: 1024px) 380px, 320px";

  return (
    <figure
      dir={LOCALE_DIRECTION[locale]}
      className={`mx-auto w-full ${figureWidthClass}${className ? ` ${className}` : ""}`}
    >
      <div className="overflow-hidden rounded-[26px] border border-charcoal/10 bg-warm-white/70 p-2">
        {hasIntrinsicSize ? (
          <Image
            src={hero.src}
            alt={hero.alt}
            width={hero.width}
            height={hero.height}
            sizes={heroSizes}
            priority={priority}
            className="h-auto w-full rounded-[20px]"
          />
        ) : (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[20px]">
            <Image
              src={hero.src}
              alt={hero.alt}
              fill
              sizes="(min-width: 1024px) 380px, 320px"
              priority={priority}
              className="object-cover"
            />
          </div>
        )}
      </div>
    </figure>
  );
}
