import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/** HOMEPAGE_STORYBOARD.md §2 "02 — Brand Intro". */
export function BrandIntro({ dict }: { dict: Dictionary["brandIntro"] }) {
  return (
    <section className="bg-cream px-6 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">{dict.heading}</h2>
        <p className="mt-6 text-balance leading-8 text-charcoal/80">{dict.body}</p>
        <a href="#doctor-story" className="mt-6 inline-block text-sm text-gold hover:text-gold-hover">
          {dict.cta} ←
        </a>
      </Reveal>
    </section>
  );
}
