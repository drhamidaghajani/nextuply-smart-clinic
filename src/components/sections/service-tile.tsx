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
/**
 * Round 2026-07-26 (doctor feedback, per Hamid — "make the services
 * section clearer for normal users by showing what each main service
 * includes"). `includedItemsLabel`/`includedItemsPreviewCount` are
 * optional and default to showing nothing — the About page's call site
 * (`about/page.tsx`) doesn't pass them, so its grid renders byte-for-byte
 * identical to before this round; only `FeaturedServicesSection`
 * (homepage) opts in. Kept inside this shared tile rather than
 * duplicated at each call site so the homepage and any future reuse stay
 * pixel-consistent, same reasoning as this component's own original
 * extraction.
 */
export function ServiceTile({
  item,
  locale,
  isFeatured = false,
  includedItemsLabel,
  includedItemsPreviewCount = 4,
}: {
  item: ServiceTaxonomyItem;
  locale: Locale;
  isFeatured?: boolean;
  includedItemsLabel?: string;
  includedItemsPreviewCount?: number;
}) {
  const previewItems = includedItemsLabel ? item.includedItems[locale].slice(0, includedItemsPreviewCount) : [];
  const remainingCount = includedItemsLabel ? item.includedItems[locale].length - previewItems.length : 0;

  return (
    // Round 2026-08-27 (P0 hotfix, per Hamid — homepage clicks "doing
    // nothing"): plain `<a>`, not `next/link`. Root cause traced live on
    // production: the uncompressed hero video request (~20MB, never
    // completing on the wire — see hero-video.tsx) saturates the
    // browser's limited per-origin connection pool, starving other
    // in-flight requests behind it. `Link`'s client-side navigation
    // intercepts the click with `preventDefault()` and waits on a fetch
    // for the destination route that gets queued behind that same
    // starved pool — so the click visibly does nothing until (if ever)
    // that fetch resolves. A native `<a href>` has no JS in the click
    // path: the browser navigates immediately as a real top-level load,
    // which is not similarly blocked. Confirmed with Playwright directly
    // against production: a `Link`-based click timed out waiting for the
    // SPA transition while several unrelated small requests (icons, a JS
    // chunk) were still pending behind the video at the same moment.
    <a
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

      {includedItemsLabel && previewItems.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1 sm:mt-3 sm:gap-1.5">
          <span className="text-[8px] font-semibold uppercase tracking-wide text-charcoal/35 transition-colors duration-[900ms] ease-in-out group-hover:text-warm-white/50 sm:text-[10px]">
            {includedItemsLabel}
          </span>
          {previewItems.map((label) => (
            <span
              key={label}
              className="rounded-full bg-charcoal/[0.05] px-1.5 py-0.5 text-[8px] leading-none text-charcoal/55 transition-colors duration-[900ms] ease-in-out group-hover:bg-warm-white/10 group-hover:text-warm-white/75 sm:px-2 sm:py-1 sm:text-[10px]"
            >
              {label}
            </span>
          ))}
          {remainingCount > 0 ? (
            <span className="text-[8px] text-charcoal/35 transition-colors duration-[900ms] ease-in-out group-hover:text-warm-white/50 sm:text-[10px]">
              +{remainingCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </a>
  );
}
