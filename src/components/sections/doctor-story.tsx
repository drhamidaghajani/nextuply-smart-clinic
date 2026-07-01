import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/** HOMEPAGE_STORYBOARD.md §2 "03 — Doctor Story". */
export function DoctorStory({ dict }: { dict: Dictionary["doctorStory"] }) {
  return (
    <section id="doctor-story" className="bg-warm-white px-6 py-24 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 sm:items-center">
        <Reveal>
          <div
            aria-hidden
            className="aspect-[4/5] w-full rounded-2xl bg-charcoal/5 flex items-center justify-center text-xs text-charcoal/40"
          >
            عکس/ویدیوی دکتر — در انتظار دریافت
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">{dict.heading}</h2>
          <p className="mt-6 leading-8 text-charcoal/80">{dict.body}</p>
          <div className="mt-8">
            <Button href="/about" variant="secondary">
              {dict.cta}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
