import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/** HOMEPAGE_STORYBOARD.md §2 "09 — Testimonials". */
export function Testimonials({ dict }: { dict: Dictionary["testimonials"] }) {
  return (
    <section className="bg-cream px-6 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">{dict.heading}</h2>
      </Reveal>
      <div className="mx-auto mt-12 max-w-2xl space-y-6">
        {dict.items.map((item) => (
          <Reveal key={item.quote}>
            <blockquote className="rounded-2xl bg-warm-white p-8 text-center">
              <p className="text-lg leading-8 text-charcoal">“{item.quote}”</p>
              <footer className="mt-4 text-sm text-charcoal/50">{item.attribution}</footer>
            </blockquote>
          </Reveal>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link href="/testimonials" className="text-sm text-gold hover:text-gold-hover">
          {dict.cta} ←
        </Link>
      </div>
    </section>
  );
}
