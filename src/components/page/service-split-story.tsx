import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * Alternating editorial split — short text on one side, a visual
 * (`ServiceVisualPanel`) on the other, mirrored via `reverse`. This is
 * the core storytelling unit of the redesigned service detail page,
 * replacing the previous "centered paragraph, then another centered
 * paragraph" repetition the brief flagged as the core problem.
 *
 * Round 2026-07-13 (About page premium redesign) — added `warm-white` as
 * a third, light tone alongside `cream`/`navy`, so a page with several
 * consecutive light split sections (About has more than any service
 * detail page) can still alternate its two light surfaces instead of
 * repeating the same cream twice in a row. Purely additive: existing
 * `cream`/`navy` callers are unaffected.
 */
export function ServiceSplitStory({
  eyebrow,
  title,
  body,
  visual,
  reverse = false,
  tone = "cream",
}: {
  eyebrow?: string;
  title: string;
  /** A single paragraph, or several — each rendered as its own `<p>`. */
  body: string | readonly string[];
  visual: ReactNode;
  reverse?: boolean;
  tone?: "cream" | "warm-white" | "navy";
}) {
  const isDark = tone === "navy";
  const bgClass = isDark ? "bg-gradient-to-br from-deep-navy to-[#1a2540]" : tone === "warm-white" ? "bg-warm-white" : "bg-cream";
  const headerBg = isDark ? "#0f172a" : tone === "warm-white" ? "#faf7f1" : "#fcfbf4";
  const paragraphs = Array.isArray(body) ? body : [body as string];
  return (
    <section data-header-bg={headerBg} className={`relative overflow-hidden px-6 py-16 sm:px-8 sm:py-24 ${bgClass}`}>
      <div className={`mx-auto grid max-w-5xl items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <Reveal>
          {eyebrow ? (
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] sm:text-sm ${isDark ? "text-gold" : "text-gold"}`}>{eyebrow}</p>
          ) : null}
          <h2 className={`text-balance text-xl font-bold leading-tight sm:text-2xl lg:text-[30px] ${eyebrow ? "mt-3" : ""} ${isDark ? "text-warm-white" : "text-charcoal"}`}>
            {title}
          </h2>
          <div className={`mt-4 space-y-3 text-sm leading-7 sm:text-base sm:leading-8 ${isDark ? "text-warm-white/70" : "text-charcoal/70"}`}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>{visual}</Reveal>
      </div>
    </section>
  );
}
