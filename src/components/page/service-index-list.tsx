import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import type { ServiceTaxonomyItem } from "@/content/services";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * Round 2026-07-13 (service-page premium redesign, per Hamid): the
 * services index's own dedicated editorial list — deliberately a
 * separate component from `EditorialCardGrid` (which Knowledge also
 * depends on and this task must not touch/redesign) rather than a shared
 * one, even though the two look related. Each row alternates which side
 * carries the icon vs. the title (mirrored every other row) for the
 * "varied rhythm, not a generic equal grid" the brief asked for, plus a
 * large low-opacity ghost icon behind the row for scale/texture.
 */
export function ServiceIndexList({
  items,
  locale,
  viewDetailsLabel,
}: {
  items: readonly ServiceTaxonomyItem[];
  locale: Locale;
  viewDetailsLabel: string;
}) {
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  return (
    <div className="mx-auto max-w-5xl border-t border-charcoal/10">
      {items.map((item, index) => {
        const mirrored = index % 2 === 1;
        return (
          <Reveal key={item.id} delay={index * 0.06}>
            <Link
              href={`/${locale}/services/${item.slug}`}
              className="group relative flex flex-col gap-6 overflow-hidden border-b border-charcoal/10 py-10 transition-colors duration-300 ease-out hover:bg-charcoal/[0.015] sm:py-14 md:flex-row md:items-center md:gap-10"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 font-heading text-[9rem] font-bold leading-none text-charcoal/[0.03] transition-colors duration-300 ease-out group-hover:text-gold/[0.06] sm:text-[11rem]"
                style={mirrored ? { insetInlineStart: "auto", insetInlineEnd: "-1rem" } : { insetInlineStart: "-1rem" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className={`relative flex items-center gap-5 md:w-80 md:shrink-0 ${mirrored ? "md:order-2 md:justify-end md:text-end" : ""}`}>
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ring-1 ring-charcoal/10 transition-all duration-300 ease-out group-hover:ring-gold/40 sm:h-20 sm:w-20 ${mirrored ? "md:order-2" : ""}`}
                >
                  <span
                    aria-hidden
                    className="block h-8 w-8 shrink-0 bg-charcoal/70 transition-colors duration-300 ease-out group-hover:bg-gold sm:h-9 sm:w-9"
                    style={{
                      WebkitMaskImage: `url(/icons/services/${item.iconKey}.png)`,
                      maskImage: `url(/icons/services/${item.iconKey}.png)`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">{item.englishLabel}</p>
                  <h3 className="mt-1 text-xl font-bold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-2xl">
                    {item.title[locale]}
                  </h3>
                </div>
              </div>

              <div className={`relative flex-1 ${mirrored ? "md:text-end" : ""}`}>
                <p className="max-w-md text-sm leading-7 text-charcoal/65 sm:text-base sm:leading-8">{item.subtitle[locale]}</p>
                <span className={`mt-4 inline-flex items-center gap-2 text-sm font-medium text-charcoal/50 transition-colors duration-300 ease-out group-hover:text-gold ${mirrored ? "md:flex-row-reverse" : ""}`}>
                  {viewDetailsLabel} {arrow}
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
