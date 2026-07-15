import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

export interface EditorialCardItem {
  key: string;
  href: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  meta?: string;
  iconKey?: string;
}

/**
 * Premium editorial index — a stacked list of full-width rows separated
 * by hairlines, each with a large ghost index number (or masked service
 * icon) on one side and title/subtitle on the other. Deliberately NOT a
 * boxed card grid (per the brief's explicit "do not create busy card
 * grids" instruction) — closer to a fashion-editorial index or a hotel
 * group's "our properties" list than a SaaS feature grid. Used by both
 * the Services index (icon glyphs) and the Knowledge index (numbered).
 */
export function EditorialCardGrid({ items, locale }: { items: readonly EditorialCardItem[]; locale: Locale }) {
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";
  return (
    <div className="mx-auto max-w-4xl border-t border-charcoal/10">
      {items.map((item, index) => (
        <Reveal key={item.key} delay={index * 0.05}>
          <Link
            href={item.href}
            className="group flex flex-col gap-3 border-b border-charcoal/10 py-7 transition-colors duration-300 ease-out hover:bg-charcoal/[0.02] sm:flex-row sm:items-center sm:gap-8 sm:py-9"
          >
            <div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
              {item.iconKey ? (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-charcoal/10 transition-colors duration-300 ease-out group-hover:ring-gold/40">
                  <span
                    aria-hidden
                    className="block h-5 w-5 shrink-0 bg-charcoal/70 transition-colors duration-300 ease-out group-hover:bg-gold"
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
              ) : (
                <span aria-hidden className="font-heading text-2xl font-bold text-gold/30 sm:text-3xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}
              <div className="sm:hidden">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gold">{item.eyebrow}</p>
              </div>
            </div>

            <div className="flex-1">
              <p className="hidden text-[10px] font-semibold uppercase tracking-wide text-gold sm:block">{item.eyebrow}</p>
              <h3 className="mt-1 text-base font-bold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-charcoal/60 sm:max-w-xl">{item.subtitle}</p>
            </div>

            <div className="flex items-center justify-between gap-3 sm:w-28 sm:shrink-0 sm:flex-col sm:items-end sm:gap-2">
              {item.meta ? <span className="text-xs text-charcoal/45">{item.meta}</span> : <span />}
              <span
                aria-hidden
                className="text-gold opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 sm:text-lg"
              >
                {arrow}
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
