import Link from "next/link";

import { getServiceHref, type ServiceTaxonomyItem } from "@/content/services";
import type { Locale } from "@/i18n/locales";

/**
 * Round 2026-07-14 (About page rejected twice, per Hamid — "specialty
 * section must match homepage service-card scale... inspect
 * FeaturedServicesSection and reuse or extract the card component
 * instead of rebuilding a weaker imitation"). Extracted verbatim from
 * `FeaturedServicesSection`'s tile markup (same classes, same icon
 * sizes, same hover behavior) so any page using this component is
 * guaranteed pixel-identical to the homepage's "حوزه‌های تخصصی" cards —
 * not an approximation. `FeaturedServicesSection` itself now renders
 * this component instead of its own inline markup; its own visual
 * output is unchanged (verified — same props, same classes, only the
 * `motion.div` stagger wrapper stays in that file).
 */
export function ServiceTile({
  item,
  locale,
  isFeatured = false,
}: {
  item: ServiceTaxonomyItem;
  locale: Locale;
  isFeatured?: boolean;
}) {
  return (
    <Link
      href={getServiceHref(locale, item.slug)}
      className={`group flex h-full flex-col items-center rounded-xl bg-warm-white px-2 py-3 text-center shadow-sm shadow-charcoal/5 ring-1 transition-all duration-[900ms] ease-in-out hover:-translate-y-0.5 hover:bg-deep-navy hover:shadow-xl hover:shadow-charcoal/20 hover:ring-gold/30 sm:rounded-2xl sm:px-5 sm:py-6 ${
        isFeatured ? "ring-gold/25" : "ring-charcoal/5"
      }`}
    >
      <div className="flex items-center justify-center rounded-full p-1.5 ring-1 ring-deep-navy/10 transition-all duration-[900ms] ease-in-out group-hover:ring-warm-white/20 sm:p-2">
        <span
          aria-hidden
          className="block h-[35px] w-[35px] shrink-0 bg-deep-navy transition-colors duration-[900ms] ease-in-out group-hover:bg-warm-white sm:h-[53px] sm:w-[53px] lg:h-[62px] lg:w-[62px]"
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
      </div>

      <h3 className="mt-1.5 text-[11px] font-semibold leading-tight text-charcoal transition-colors duration-[900ms] ease-in-out group-hover:text-warm-white sm:mt-3 sm:text-sm lg:text-base">
        {item.title[locale]}
      </h3>
      <p className="-mt-0.5 text-[9px] font-normal uppercase tracking-wide text-charcoal/45 transition-colors duration-[900ms] ease-in-out group-hover:text-warm-white/70 sm:text-[11px]">
        {item.englishLabel}
      </p>
      <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-charcoal/60 transition-colors duration-[900ms] ease-in-out group-hover:text-warm-white/80 sm:mt-2.5 sm:text-xs lg:text-sm">
        {item.subtitle[locale]}
      </p>
    </Link>
  );
}
