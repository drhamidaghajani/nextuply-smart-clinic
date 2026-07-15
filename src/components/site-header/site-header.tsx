"use client";

import Link from "next/link";
import { useState } from "react";

import { ClinicLogo } from "@/components/clinic-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { HeaderDictionary } from "@/i18n/dictionary-types";
import { resolveNavHref } from "@/i18n/resolve-nav-href";
import type { Locale } from "@/i18n/locales";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant";

import { MobileMenu } from "./mobile-menu";
import { useHeaderTheme } from "./use-header-theme";

/**
 * Site-wide header — correction pass, 2026-07-09, replacing the earlier
 * logo+CTA-only version per Hamid's rejection of it ("not acceptable
 * visually") and his precise drwilliammiami.com-based mechanism brief.
 *
 * Mechanism: `fixed` overlay (unchanged reasoning from the previous
 * round — every homepage section is `h-dvh` + `.snap-section` against
 * `html { scroll-snap-type: y mandatory }`, so a normal-flow header would
 * push every section down and break their one-viewport fit). The header's
 * background/text color tracks whichever section is behind it
 * (`useHeaderTheme`, IntersectionObserver on `[data-header-bg]` — see
 * every section file's root element). No `mix-blend-mode`, transitions
 * kept to opacity/transform/color, ~300ms.
 *
 * Round 2026-07-09, correction #2 (per Hamid — explicitly reverses his own
 * immediately-prior brief, which said "we do NOT want a hidden header
 * that suddenly appears after the hero"; flagged here rather than silently
 * swapped): the header is now hidden (opacity/translate, not unmounted —
 * `pointer-events-none` while hidden so it can't be clicked/tabbed to)
 * while `isOnHero` is true, and fades in once the user scrolls into the
 * next section. Since it's never shown in a hero-integrated oversized
 * state anymore, the previous two-tier shrink height is gone — one fixed
 * compact height (`h-[88px]` desktop / `h-[68px]` mobile) is all that's
 * needed now.
 *
 * Desktop: 3-column grid, right-to-left in DOM = right-to-left visually
 * under this page's `dir="rtl"` (no `dir="ltr"` override, same convention
 * as every other section) — logo first (visual right), nav second
 * (center), CTA third (visual left), matching his literal "Right side:
 * logo / Left side: CTA" spec exactly via natural RTL order, not a trick.
 * Mobile: logo + a single hamburger button opening `MobileMenu`
 * (fullscreen overlay, own file).
 *
 * Round 2026-07-11 (per Hamid):
 * - Logo subtitle text was wrong ("کلینیک زیبایی و بازسازی صورت") —
 *   replaced with his real specialty line (already in `fa.hero.doctorSpecialty`),
 *   shortened for a one-line fit; the `max-w` clamp on `ClinicLogo`'s
 *   subtitle that was causing wraps is gone (see clinic-logo.tsx).
 * - Added `LanguageSwitcher` (fa/en/ar) next to the CTA — see that
 *   component's own doc-comment for the en/ar-has-no-content caveat.
 *
 * Round 2026-07-13 (locale rollout, docs/adr/0005): nav items, logo
 * subtitle, CTA label, and both aria-labels now come from a `dict` prop
 * (`getDictionary(locale)` in `layout.tsx`) instead of being hardcoded
 * here — same exact `fa` strings as before, just relocated so `en`/`ar`
 * render correctly too. No visual change.
 *
 * Round 2026-07-13, header polish/correction round (per Hamid — "the
 * header must take the exact background color of the section currently
 * underneath it"): that mechanism already existed exactly as specced
 * (`useHeaderTheme`'s IntersectionObserver + `style={{backgroundColor}}`
 * + luminance-derived `isDark`) — verified against every section's real
 * `data-header-bg` value, all present and correct, nothing to add there.
 * What this round actually fixes: nav-link/hamburger color transitions
 * bumped 200ms→300ms to match the header background's own duration (was
 * a few frames out of sync, read as slightly uncoordinated); CTA gets a
 * subtle press state and a soft gold-tinted glow in its dark-background
 * (gold-gradient) state for extra polish, still the same size/shape — no
 * redesign. `LanguageSwitcher`'s and `ClinicLogo`'s OWN color transitions
 * (missing entirely before) are fixed in those files directly.
 *
 * Round 2026-07-14 (per Hamid, real bug, screenshot): the English nav —
 * "Dr. Sadighi", "Before & After", "Knowledge Center" — was wrapping onto
 * a second line while the header's fixed height stayed single-line,
 * clipping the wrapped items top/bottom. Root cause, confirmed by
 * measuring the live DOM (not guessed): the center nav grid column only
 * has ~542px at a common 1440px desktop width (this header's `max-w-6xl`
 * content box, minus the logo and CTA/switcher columns' own widths) —
 * `fa`'s short Persian labels always fit; `en`'s longer English phrases,
 * with no `whitespace-nowrap`, didn't overflow the row, they wrapped
 * *inside* individual links instead, which is worse. Fixed by adding
 * `whitespace-nowrap` (so a link can no longer break mid-label) together
 * with a slightly tighter `gap`/font-size specifically in the `lg`
 * (1024–1279px) range where this was tightest, widening back out at
 * `xl:` — closes the real measured ~95px deficit with margin, verified
 * empirically (see the round's report) rather than assumed fixed.
 */
export function SiteHeader({ dict, locale }: { dict: HeaderDictionary; locale: Locale }) {
  const { background, isDark, isOnHero } = useHeaderTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const textTone = isDark ? "text-warm-white/85" : "text-charcoal/80";
  const ctaClass = isDark
    ? "bg-gradient-to-b from-gold to-gold-hover text-deep-navy shadow-[0_8px_24px_-10px_rgba(201,161,90,0.6)] hover:brightness-105"
    : "border border-charcoal/25 text-charcoal hover:border-gold hover:text-gold";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-[opacity,transform,background-color,border-color] duration-300 ease-out ${
          isOnHero ? "pointer-events-none -translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        } ${isDark ? "border-warm-white/10" : "border-charcoal/10"}`}
        style={{ backgroundColor: background }}
      >
        <div className="mx-auto grid h-[68px] max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-8 lg:h-[88px]">
          <Link href={`/${locale}`} aria-label={dict.logoSubtitle}>
            <ClinicLogo tone={isDark ? "light" : "dark"} subtitle={dict.logoSubtitle} priority />
          </Link>

          <nav className="hidden items-center justify-center gap-4 lg:flex xl:gap-6">
            {dict.navItems.map((item) => (
              <a
                key={item.href}
                href={resolveNavHref(item.href, locale)}
                className={`whitespace-nowrap text-[13px] font-medium transition-colors duration-300 ease-out hover:text-gold xl:text-sm ${textTone}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2 xl:gap-3">
            <LanguageSwitcher tone={isDark ? "light" : "dark"} className="hidden lg:inline-flex" />

            <AssistantTriggerButton
              intent="consultation_booking"
              source="header"
              className={`hidden whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-[color,background-color,border-color,box-shadow,filter] duration-300 ease-out active:scale-[0.98] lg:inline-flex xl:px-5 xl:text-sm ${ctaClass}`}
            >
              {dict.ctaLabel}
            </AssistantTriggerButton>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label={dict.openMenuLabel}
              aria-expanded={isMobileMenuOpen}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ease-out lg:hidden ${textTone}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} dict={dict} locale={locale} />
    </>
  );
}
