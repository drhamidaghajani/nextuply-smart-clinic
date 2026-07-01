import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "04 — Before/After Gallery".
 * The real Before/After Slider (drag-to-reveal, UI_GUIDELINES.md §5) is its
 * own component with real photo pairs — pending CONTENT_INVENTORY.md §8.
 * This placeholder establishes the section's layout/rhythm only.
 */
export function BeforeAfterGallery({ dict }: { dict: Dictionary["beforeAfter"] }) {
  return (
    <section className="bg-cream px-6 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">{dict.heading}</h2>
        <p className="mt-3 text-charcoal/70">{dict.subheading}</p>
      </Reveal>
      <div className="mx-auto mt-12 flex max-w-5xl gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden
            className="aspect-[4/3] w-72 shrink-0 rounded-2xl bg-charcoal/5 flex items-center justify-center text-xs text-charcoal/40"
          >
            نمونه قبل/بعد #{i} — در انتظار دریافت
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link href="/gallery" className="text-sm text-gold hover:text-gold-hover">
          {dict.cta} ←
        </Link>
      </div>
    </section>
  );
}
