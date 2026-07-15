import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * Two-column editorial split — text on one side, a quiet visual (a large
 * numeral, an icon, a short stat) on the other, alternating sides via
 * `reverse`. No stock/placeholder photography is invented here (none
 * exists for these pages yet) — the "visual" side is typographic/iconic,
 * same restrained language as `WhyDrSadighiSection`'s metric cards,
 * not a fake lifestyle photo.
 */
export function SplitFeatureSection({
  eyebrow,
  title,
  body,
  visual,
  reverse = false,
  tone = "cream",
}: {
  eyebrow?: string;
  title: string;
  body: string;
  visual: ReactNode;
  reverse?: boolean;
  tone?: "cream" | "warm-white";
}) {
  return (
    <section className={`px-6 py-16 sm:px-8 sm:py-24 ${tone === "cream" ? "bg-cream" : "bg-warm-white"}`}>
      <div className={`mx-auto grid max-w-5xl items-center gap-8 sm:gap-14 lg:grid-cols-2 lg:gap-20 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <Reveal>
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">{eyebrow}</p> : null}
          <h2 className={`text-balance text-xl font-bold leading-tight text-charcoal sm:text-2xl lg:text-[28px] ${eyebrow ? "mt-3" : ""}`}>{title}</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/70 sm:text-base sm:leading-8">{body}</p>
        </Reveal>
        <Reveal delay={0.1} className="flex justify-center">
          {visual}
        </Reveal>
      </div>
    </section>
  );
}
