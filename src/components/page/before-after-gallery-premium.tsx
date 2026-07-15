"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

import { PHOTO_POSITION, REAL_PHOTOS } from "@/components/sections/gallery-photos";
import type { ServiceTaxonomyItem } from "@/content/services";
import type { Locale } from "@/i18n/locales";

const ALL_LABEL: Record<Locale, string> = { fa: "همه موارد", en: "All", ar: "الكل" };

/**
 * Premium dark results gallery — filter pills (reusing `FaqSection`'s
 * pill pattern) drive an instant client-side filter (no page reload),
 * animated with a simple fade/reflow (`AnimatePresence` + `layout`), not
 * a heavy loader or parallax effect. Sits on a dark surface per the
 * brief's "dark/premium where appropriate, not a plain gallery"
 * direction — the homepage's Case Gallery masonry stays cream/light and
 * untouched; this is a deliberately different, darker treatment for the
 * dedicated results page.
 */
export function BeforeAfterGalleryPremium({
  items,
  locale,
  initialCategory,
}: {
  items: readonly ServiceTaxonomyItem[];
  locale: Locale;
  initialCategory: string | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialCategory && items.some((item) => item.galleryCategory === initialCategory) ? initialCategory : null
  );

  const visible = activeCategory ? items.filter((item) => item.galleryCategory === activeCategory) : items;

  return (
    <section className="bg-gradient-to-b from-deep-navy to-[#141d33] px-6 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-300 ease-out sm:px-5 sm:text-sm ${
              activeCategory === null ? "border-gold bg-gold/10 text-gold" : "border-warm-white/15 text-warm-white/60 hover:border-warm-white/30 hover:text-warm-white"
            }`}
          >
            {ALL_LABEL[locale]}
          </button>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveCategory(item.galleryCategory)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-300 ease-out sm:px-5 sm:text-sm ${
                activeCategory === item.galleryCategory
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-warm-white/15 text-warm-white/60 hover:border-warm-white/30 hover:text-warm-white"
              }`}
            >
              {item.title[locale]}
            </button>
          ))}
        </div>

        <motion.div layout className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-4 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-warm-white/10 transition-shadow duration-300 ease-out hover:ring-gold/40"
              >
                <Image
                  src={REAL_PHOTOS[item.galleryCategory]!}
                  alt={item.title[locale]}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  style={{ objectPosition: PHOTO_POSITION[item.galleryCategory] ?? "center" }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent p-4">
                  <p className="text-balance text-xs font-semibold text-warm-white sm:text-sm">{item.title[locale]}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
