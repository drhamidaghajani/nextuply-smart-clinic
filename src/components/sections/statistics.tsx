import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "08 — Statistics". Real numbers required from
 * the client (CONTENT_INVENTORY.md §7) — never fabricate placeholder stats
 * for a medical practice, so this renders an honest pending state instead
 * of fake counters.
 */
export function Statistics({ dict }: { dict: Dictionary["statistics"] }) {
  return (
    <section className="bg-cream px-6 py-24 text-center sm:px-8">
      <Reveal className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">{dict.heading}</h2>
        <p className="mt-6 text-sm text-charcoal/50">
          آمار واقعی کلینیک (تعداد عمل‌ها، سال تجربه، رضایت بیماران) پس از دریافت از دکتر صدیقی
          اینجا نمایش داده می‌شود — نگاه کنید به CONTENT_INVENTORY.md §7.
        </p>
      </Reveal>
    </section>
  );
}
