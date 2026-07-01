import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "06 — Services". Two distinct service families
 * per CONTENT_INVENTORY.md §2 — kept visually separate, not one flat list.
 */
export function Services({ dict }: { dict: Dictionary["services"] }) {
  return (
    <section className="bg-warm-white px-6 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">{dict.heading}</h2>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-5xl gap-10 sm:grid-cols-2">
        <Reveal>
          <h3 className="text-lg font-medium text-gold">{dict.aestheticCategory}</h3>
          <ul className="mt-4 space-y-2 text-sm text-charcoal/80">
            {dict.aestheticItems.map((item) => (
              <li key={item} className="border-b border-charcoal/10 py-2">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <h3 className="text-lg font-medium text-gold">{dict.maxillofacialCategory}</h3>
          <ul className="mt-4 space-y-2 text-sm text-charcoal/80">
            {dict.maxillofacialItems.map((item) => (
              <li key={item} className="border-b border-charcoal/10 py-2">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <div className="mt-10 text-center">
        <Link href="/services" className="text-sm text-gold hover:text-gold-hover">
          {dict.cta} ←
        </Link>
      </div>
    </section>
  );
}
