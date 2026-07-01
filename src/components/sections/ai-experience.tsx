import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "05 — AI Experience". The one deliberate
 * deep-navy dark section on the page (DESIGN_SYSTEM.md §2).
 */
export function AiExperience({ dict }: { dict: Dictionary["aiExperience"] }) {
  return (
    <section className="bg-deep-navy px-6 py-24 text-warm-white sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">{dict.heading}</h2>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
        {dict.items.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1}>
            <div className="rounded-2xl border border-warm-white/10 p-6">
              <h3 className="text-gold font-medium">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-warm-white/70">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-10 text-center">
        <a href="#booking" className="text-sm text-gold hover:text-gold-hover">
          {dict.cta} ←
        </a>
      </div>
    </section>
  );
}
