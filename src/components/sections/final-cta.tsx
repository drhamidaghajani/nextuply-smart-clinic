import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "10 — Final CTA". At most two options,
 * per UI_GUIDELINES.md §2's one-primary-CTA rule (one primary + one secondary).
 */
export function FinalCta({ dict }: { dict: Dictionary["finalCta"] }) {
  return (
    <section id="booking" className="bg-deep-navy px-6 py-24 text-center text-warm-white sm:px-8">
      <h2 className="text-2xl font-semibold sm:text-3xl">{dict.heading}</h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button href="/booking">{dict.ctaPrimary}</Button>
        <Button href="https://wa.me/989120149500" variant="secondary">
          {dict.ctaSecondary}
        </Button>
      </div>
    </section>
  );
}
