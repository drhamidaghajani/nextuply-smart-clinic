"use client";

import Link from "next/link";
import { useState } from "react";

import { BeforeAfterSlider } from "./before-after-slider";
import {
  BEFORE_AFTER_CATEGORIES,
  CATEGORY_LABEL,
  type BeforeAfterCase,
  type BeforeAfterCategory,
} from "@/content/before-after-cases";
import { getServiceHref } from "@/content/services";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

const ALL_LABEL: Record<Locale, string> = { fa: "همه", en: "All", ar: "الكل" };
const BEFORE_LABEL: Record<Locale, string> = { fa: "قبل", en: "Before", ar: "قبل" };
const AFTER_LABEL: Record<Locale, string> = { fa: "بعد", en: "After", ar: "بعد" };
const VIEW_SERVICE_LABEL: Record<Locale, string> = { fa: "مشاهده صفحه درمان", en: "View the treatment page", ar: "عرض صفحة العلاج" };
const ANGLE_LABEL: Record<Locale, string> = { fa: "زاویه", en: "View", ar: "زاوية" };
const EMPTY_LABEL: Record<Locale, string> = {
  fa: "برای این دسته هنوز نمونه‌ای ثبت نشده است.",
  en: "No cases are available in this category yet.",
  ar: "لا توجد حالات متاحة في هذه الفئة حتى الآن.",
};

/**
 * Premium case-study grid for `/before-after` (2026-08-25 rebuild) — a
 * dark navy surface, deliberately kept from the PREVIOUS version of this
 * exact page (`BeforeAfterGalleryPremium`'s own doc-comment: "Sits on a
 * dark surface per the brief's 'dark/premium where appropriate, not a
 * plain gallery' direction"). This round changes the CONTENT (real case
 * data + a comparison slider instead of one static marketing photo per
 * service), not that already-approved tone — filter-pill shape and
 * gold-active state are carried over unchanged too. `initialCategory`
 * comes from the page's own `searchParams` (server-resolved) for
 * one-directional deep-linking — `/before-after?category=implant` opens
 * pre-filtered; clicking a pill afterward is a plain client-side state
 * change, matching the same one-directional pattern the previous
 * gallery already used (no router/URL push on click).
 */
export function BeforeAfterShowcase({
  cases,
  locale,
  initialCategory,
}: {
  cases: readonly BeforeAfterCase[];
  locale: Locale;
  initialCategory: BeforeAfterCategory | null;
}) {
  const [activeCategory, setActiveCategory] = useState<BeforeAfterCategory | null>(initialCategory);
  const visible = activeCategory ? cases.filter((c) => c.category === activeCategory) : cases;

  return (
    <section className="bg-gradient-to-b from-deep-navy to-[#141d33] px-6 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          <FilterPill active={activeCategory === null} label={ALL_LABEL[locale]} onClick={() => setActiveCategory(null)} />
          {BEFORE_AFTER_CATEGORIES.map((category) => (
            <FilterPill
              key={category}
              active={activeCategory === category}
              label={CATEGORY_LABEL[category][locale]}
              onClick={() => setActiveCategory(category)}
            />
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-14 text-center text-sm text-warm-white/50">{EMPTY_LABEL[locale]}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FilterPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-300 ease-out sm:px-5 sm:text-sm ${
        active ? "border-gold bg-gold/10 text-gold" : "border-warm-white/15 text-warm-white/60 hover:border-warm-white/30 hover:text-warm-white"
      }`}
    >
      {label}
    </button>
  );
}

function CaseCard({ caseItem, locale }: { caseItem: BeforeAfterCase; locale: Locale }) {
  const [activeView, setActiveView] = useState(0);
  const view = caseItem.views[activeView];
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  return (
    <div className="flex flex-col gap-4">
      <BeforeAfterSlider
        before={view.before}
        after={view.after}
        beforeAlt={`${caseItem.title[locale]} — ${BEFORE_LABEL[locale]}`}
        afterAlt={`${caseItem.title[locale]} — ${AFTER_LABEL[locale]}`}
        beforeLabel={BEFORE_LABEL[locale]}
        afterLabel={AFTER_LABEL[locale]}
        ariaLabel={caseItem.title[locale]}
      />

      {caseItem.views.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5">
          {caseItem.views.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveView(index)}
              aria-label={`${ANGLE_LABEL[locale]} ${index + 1}`}
              className={`h-1.5 w-6 rounded-full transition-colors duration-300 ease-out ${index === activeView ? "bg-gold" : "bg-warm-white/15"}`}
            />
          ))}
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gold">{CATEGORY_LABEL[caseItem.category][locale]}</p>
        <h3 className="mt-1 text-base font-bold leading-snug text-warm-white">{caseItem.title[locale]}</h3>
        <p className="mt-1 text-xs text-warm-white/40">{caseItem.privacyLabel[locale]}</p>
        <p className="mt-2 text-sm leading-6 text-warm-white/65">{caseItem.description[locale]}</p>
        <Link href={getServiceHref(locale, caseItem.serviceSlug)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-hover">
          {VIEW_SERVICE_LABEL[locale]} <span aria-hidden>{arrow}</span>
        </Link>
      </div>
    </div>
  );
}
