import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "01 — Hero". Video not yet available
 * (CONTENT_INVENTORY.md §8) — the darkened placeholder panel stands in
 * honestly for the real asset rather than a stock photo.
 */
export function Hero({ dict }: { dict: Dictionary["hero"] }) {
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-deep-navy text-warm-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-deep-navy/40 via-deep-navy/70 to-deep-navy flex items-center justify-center"
      >
        <span className="max-w-xs text-center text-xs text-warm-white/40">
          {dict.videoPending}
        </span>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 pt-32 text-center sm:px-8">
        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-6xl">
          {dict.headline}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-warm-white/80 sm:text-lg">
          {dict.subheadline}
        </p>
        <div className="mt-10">
          <Button href="#booking">{dict.ctaPrimary}</Button>
        </div>
      </div>
    </section>
  );
}
