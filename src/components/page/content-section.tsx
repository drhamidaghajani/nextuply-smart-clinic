import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * Shared content-section wrapper for internal pages — eyebrow + heading +
 * optional lead paragraph + arbitrary body. `tone` picks the two
 * backgrounds already established across the homepage (`cream`/
 * `warm-white`) so alternating sections on a long page read as distinct
 * blocks without introducing a third surface color.
 *
 * Round 2026-07-13 (design-quality pass): added `eyebrow` (matches
 * `FeaturedServicesSection`/`FaqSection`'s uppercase-tracked-label
 * convention) and widened the max content width slightly for a calmer,
 * more editorial line length — same heading scale as before (still the
 * project's standing 30px/22px rule), not a new type system.
 *
 * Round 2026-07-13, same day (service-page premium redesign): added
 * optional `headerBg` — sets `data-header-bg` so the header's background-
 * color tracker (`use-header-theme.ts`) has a value to pick up on
 * sections that don't come from `PageHero`. Purely additive: omitted by
 * every existing caller, so this changes nothing for pages this task
 * doesn't touch (About, Contact, Health Tourism, Knowledge).
 */
export function ContentSection({
  eyebrow,
  heading,
  lead,
  tone = "cream",
  center = false,
  headerBg,
  children,
}: {
  eyebrow?: string;
  heading?: string;
  lead?: string;
  tone?: "cream" | "warm-white";
  center?: boolean;
  headerBg?: string;
  children?: ReactNode;
}) {
  return (
    <section
      data-header-bg={headerBg}
      className={`px-6 py-16 sm:px-8 sm:py-24 ${tone === "cream" ? "bg-cream" : "bg-warm-white"}`}
    >
      <div className="mx-auto max-w-3xl">
        {heading ? (
          <Reveal>
            <div className={center ? "text-center" : ""}>
              {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">{eyebrow}</p> : null}
              <h2 className={`text-balance font-bold leading-tight text-charcoal sm:text-2xl lg:text-[30px] ${eyebrow ? "mt-3 text-xl" : "text-xl"}`}>
                {heading}
              </h2>
              {lead ? <p className="mt-3 text-sm leading-7 text-charcoal/70 sm:text-base">{lead}</p> : null}
            </div>
          </Reveal>
        ) : null}
        <div className={heading ? "mt-10" : ""}>{children}</div>
      </div>
    </section>
  );
}
