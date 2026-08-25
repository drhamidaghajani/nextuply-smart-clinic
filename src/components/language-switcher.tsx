"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { localeFromPathname, localeHref, pathWithoutLocalePrefix } from "@/i18n/locale-href";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";

const LOCALE_LABELS: Record<Locale, string> = { fa: "فا", en: "EN", ar: "AR" };

/**
 * Round 2026-08-23 (final production URL restructuring): rebuilt on top
 * of `pathWithoutLocalePrefix`/`localeHref` instead of blindly replacing
 * `pathname.split("/")[1]` — that assumed the first path segment was
 * ALWAYS a locale, which broke the instant Persian became unprefixed:
 * on `/knowledge/x`, `segments[0]` is `"knowledge"`, page content, not a
 * locale, so the old code would have silently mangled it into
 * `/en/x` (dropping "knowledge" entirely) instead of `/en/knowledge/x`.
 */
function hrefForLocale(pathname: string, targetLocale: Locale): string {
  const bare = pathWithoutLocalePrefix(pathname);
  return localeHref(targetLocale, bare === "/" ? "" : bare);
}

/**
 * fa/en/ar switcher — one of `COMPONENT_GUIDE.md`'s originally-planned
 * shared composites ("Drives the fa/en/ar + RTL/LTR switch"), built now
 * per Hamid's 2026-07-11 request (Header + Footer, "کاملا زیبا و با افکت
 * قابل دیدن و تغییر" — a real animated control, not a plain button).
 *
 * A segmented pill with a sliding highlight behind the active locale
 * (Framer Motion `layoutId`). The `layoutId` is namespaced per mounted
 * instance via `useId()` — Header and Footer both render this component
 * at the same time, and sharing one `layoutId` across two simultaneously-
 * visible elements would make Framer Motion fight to reconcile their
 * positions instead of animating each independently.
 *
 * Round 2026-07-13 (locale rollout, docs/adr/0005 then 0006): `en`/`ar`
 * first got real chrome + a minimal holding homepage instead of a 404,
 * then — same day, per Hamid's "not acceptable" follow-up — the full
 * 10-section homepage itself, driven by `getDictionary(locale)` just
 * like `fa`. All three locales now render the same page structure.
 *
 * `LOCALE_LABELS` intentionally shows each language's own endonym
 * ("فا"/"EN"/"AR"), not a translation of the label into the current page
 * language — the standard convention for language switchers.
 *
 * Round 2026-07-13 (header polish/correction round): `border`/text tone
 * flip when the header's `tone` prop changes (scroll-driven background
 * tracking, see `use-header-theme.ts`) but neither had a `transition-
 * colors` class — the color snapped instantly instead of the ~300ms
 * smooth fade the rest of the header uses. Added, matching the header's
 * own transition duration exactly so the whole header (background, nav
 * text, logo, CTA, switcher) reads as one synchronized fade rather than
 * this one control lagging/snapping out of step.
 *
 * Round 2026-07-14 (pre-staging QA, per Hamid — real bug: every link here
 * unconditionally pointed at `/{locale}`, so switching language from any
 * page other than the homepage silently dropped the user back to it,
 * e.g. `/fa/services/rhinoplasty` → EN landed on `/en` instead of
 * `/en/services/rhinoplasty`). Now built from the actual current
 * pathname via `hrefForLocale` (above), plus the current query
 * string/hash (read client-side via `window.location` into state — not
 * `useSearchParams()`, which would force this component's whole subtree
 * into a Suspense boundary / opt out of static rendering for every page
 * that mounts it, i.e. nearly every page on the site). The state starts
 * empty so the very first client render still matches the server-
 * rendered HTML (no hydration mismatch); the effect then fills in
 * `?query#hash` a moment after mount, which is a normal re-render, not a
 * hydration error.
 */
export function LanguageSwitcher({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const pathname = usePathname();
  const currentLocale = localeFromPathname(pathname);
  const uid = useId();
  const shouldReduceMotion = useReducedMotion();

  const [queryAndHash, setQueryAndHash] = useState("");
  useEffect(() => {
    setQueryAndHash(`${window.location.search}${window.location.hash}`);
  }, [pathname]);

  const borderColor = tone === "light" ? "border-warm-white/20" : "border-charcoal/15";
  const inactiveText = tone === "light" ? "text-warm-white/55 hover:text-warm-white" : "text-charcoal/55 hover:text-charcoal";

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 transition-colors duration-300 ease-out ${borderColor} ${className ?? ""}`}
    >
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={`${hrefForLocale(pathname, locale)}${queryAndHash}`}
            aria-current={isActive ? "true" : undefined}
            className="relative rounded-full px-2.5 py-1 text-xs font-semibold"
          >
            {isActive && (
              <motion.span
                layoutId={`lang-pill-${uid}`}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-full bg-gold"
              />
            )}
            <span className={`relative transition-colors duration-300 ease-out ${isActive ? "text-deep-navy" : inactiveText}`}>
              {LOCALE_LABELS[locale]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
