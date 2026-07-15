import Link from "next/link";

import { ClinicLogo } from "@/components/clinic-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { FooterDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";
import { resolveNavHref } from "@/i18n/resolve-nav-href";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
/**
 * Display-only, `fa` only — never used for `tel:` hrefs, which need real
 * ASCII digits to dial correctly. `en`/`ar` keep ordinary Western digits
 * (see `ar.ts`'s own doc-comment on that judgment call).
 */
function toLocaleDigits(value: string, locale: Locale): string {
  if (locale !== "fa") return value;
  return value.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]!);
}
function toTelHref(value: string): string {
  return `tel:${value.replace(/[^0-9+]/g, "")}`;
}

/**
 * HOMEPAGE_STORYBOARD.md §2 "11 — Footer (Premium)". Two locations per
 * DATABASE_GUIDE.md's `Location` entity (Tehran + Tabriz).
 *
 * Round 2026-07-09 (correction pass, per Hamid: "The previous
 * implementation is not acceptable visually... Rebuild it"): full
 * 4-column rebuild replacing the earlier single-CTA-row + 3-column grid.
 * Dr. William Miami-inspired structure (brand / خدمات / تماس / راهنما),
 * adapted per his explicit "less clutter, more luxury, more calm" — no
 * background image (none exists yet), so a subtle dark gradient stands in
 * per his own fallback instruction. Working hours placed inside the تماس
 * column rather than as a 5th column — his spec listed it separately from
 * the 4 columns but didn't assign it a location; contact-adjacent felt
 * like the natural fit. His precise spec also does not include a
 * standalone CTA button anywhere in the footer (unlike the header, where
 * it's repeated explicitly) — the CTA row added in the previous round is
 * therefore removed here, not kept as an extra.
 *
 * `snap-section` on `<footer>` is load-bearing, not cosmetic — see git
 * history/CHANGELOG for the scroll-snap-unreachable-footer bug this fixed
 * when footer was first mounted; unrelated to this round's visual rebuild
 * and left untouched.
 *
 * Round 2026-07-11 (per Hamid):
 * - Background changed charcoal → navy gradient ("سورمه‌ای"), reusing the
 *   exact `from-deep-navy to-[#1a2540]` gradient already used in
 *   `why-dr-sadighi-section.tsx`/`smart-clinic-assistant-section.tsx`
 *   rather than inventing a new value. `data-header-bg` updated to match
 *   (`#0f172a`) — this drives the Header's color-tracking mechanism
 *   (`use-header-theme.ts`); leaving it stale would make the Header show
 *   the wrong color once the Footer is behind it.
 * - Brand column reordered: logo moved from above the tagline/description
 *   to below them, filling what he described as empty space at the
 *   bottom of that column.
 * - Added `LanguageSwitcher` to the bottom bar.
 *
 * Round 2026-07-12 (per Hamid):
 * - Logo doubled in size (`ClinicLogo size="lg"`) and centered within its
 *   own frame (`flex justify-center` wrapper) — it was reading small and
 *   sitting at the column's natural RTL start (right) instead of centered.
 * - Copyright row: "Nextuply" is now a real link to nextuply.com, plus a
 *   LinkedIn icon linking to the company page — both his exact URLs.
 *
 * Round 2026-07-12, mobile correction (per Hamid — real bug, screenshots
 * showed all 4 columns stacked full-width and right-aligned on mobile,
 * not the "professional mobile layout" he wanted): base grid is now
 * `grid-cols-2` with `order-*` per column (reset to source order at
 * `lg:` via `lg:order-none`) — Brand and تماس each span both columns as
 * their own full-width row, خدمات and راهنما share a row side by side.
 * Text-alignment flips `text-center` (mobile) → `lg:text-start` (desktop)
 * on the grid container so it cascades to every column without per-child
 * overrides. Desktop's 4-column layout/order is unchanged — `order-none`
 * at `lg:` falls back to DOM order, which is still Brand→خدمات→تماس→راهنما.
 *
 * Round 2026-07-13 (locale rollout, docs/adr/0005): `dict` is now typed
 * against the narrow `FooterDictionary` (not the full `fa` `Dictionary`),
 * and a new `locale` prop drives `dir` (was hardcoded `"rtl"`, silently
 * breaking `en`'s LTR direction even though `<html dir>` was already
 * correct — a real latent bug, fixed here) plus digit formatting. Column
 * headings, the "اینستاگرام: " prefix, and the copyright line's trailing
 * phrase were hardcoded Persian strings; moved into `dict` (see `fa.ts`'s
 * footer block) so `en`/`ar` render correctly — no visual/content change
 * for `fa`.
 */
export function SiteFooter({ dict, locale }: { dict: FooterDictionary; locale: Locale }) {
  return (
    <footer
      id="contact"
      data-header-bg="#0f172a"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section bg-gradient-to-b from-deep-navy to-[#1a2540] px-6 py-16 text-warm-white/70 sm:px-8 sm:py-20"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 text-center lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10 lg:text-start">
        {/* Column 1 — Brand (full-width row on mobile) */}
        <div className="order-1 col-span-2 lg:order-none lg:col-span-1">
          <p className="text-sm font-medium text-warm-white/80">{dict.tagline}</p>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-warm-white/55 lg:mx-0">{dict.description}</p>
          <div className="mt-6 flex justify-center lg:justify-center">
            <Link href={`/${locale}`}>
              <ClinicLogo tone="light" size="lg" />
            </Link>
          </div>
        </div>

        {/* Column 2 — خدمات (paired with راهنما on mobile) */}
        <div className="order-2 lg:order-none">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{dict.columnHeadings.services}</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {dict.services.map((service) => (
              <li key={service.href}>
                <a href={service.href} className="text-sm leading-6 text-warm-white/60 transition-colors duration-200 hover:text-gold">
                  {service.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — تماس (+ working hours). `order-4`: visually LAST on
            mobile (full-width row below the خدمات/راهنما pair) even
            though it's 3rd in DOM — DOM order itself is untouched
            (still Brand→خدمات→تماس→راهنما) so `lg:order-none` restores
            the exact original desktop sequence. */}
        <div className="order-4 col-span-2 lg:order-none lg:col-span-1">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{dict.columnHeadings.contact}</h3>
          <div className="mt-4 flex flex-col gap-4 text-sm leading-6 text-warm-white/60">
            <div>
              <p className="font-medium text-warm-white/75">{dict.locations.tabriz.label}</p>
              {dict.locations.tabriz.addressLines.map((line) => (
                <p key={line} className="mt-1">
                  {line}
                </p>
              ))}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 lg:justify-start">
                <a href={toTelHref(dict.locations.tabriz.phone)} className="transition-colors duration-200 hover:text-gold" dir="ltr">
                  {toLocaleDigits(dict.locations.tabriz.phone, locale)}
                </a>
                <a href={toTelHref(dict.locations.tabriz.mobile)} className="transition-colors duration-200 hover:text-gold" dir="ltr">
                  {toLocaleDigits(dict.locations.tabriz.mobile, locale)}
                </a>
              </div>
            </div>
            <div>
              <p className="font-medium text-warm-white/75">{dict.locations.tehran.label}</p>
              <p className="mt-1">{dict.locations.tehran.address}</p>
            </div>
            <div>
              {dict.hours.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p>{dict.instagramLabel}{dict.instagram}</p>
          </div>
        </div>

        {/* Column 4 — راهنما. `order-3`: visually paired with خدمات on
            mobile even though it's 4th/last in DOM. */}
        <div className="order-3 lg:order-none">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{dict.columnHeadings.guide}</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {dict.guide.map((item) =>
              item.href ? (
                <li key={item.label}>
                  <a href={resolveNavHref(item.href, locale)} className="text-sm leading-6 text-warm-white/60 transition-colors duration-200 hover:text-gold">
                    {item.label}
                  </a>
                </li>
              ) : (
                <li key={item.label} className="text-sm leading-6 text-warm-white/30">
                  {item.label}
                </li>
              )
            )}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center gap-4 border-t border-warm-white/10 pt-6 text-xs text-warm-white/40 sm:flex-row sm:justify-between">
        <p className="inline-flex flex-wrap items-center gap-x-1.5">
          <span>
            © {new Date().getFullYear()} {dict.siteName} — {dict.copyrightSuffix}{" "}
          </span>
          <a
            href="https://nextuply.com"
            target="_blank"
            rel="noreferrer"
            className="text-warm-white/55 transition-colors duration-200 hover:text-gold"
          >
            Nextuply
          </a>
          <a
            href="https://www.linkedin.com/company/nextuply/"
            target="_blank"
            rel="noreferrer"
            aria-label={dict.linkedInAriaLabel}
            className="text-warm-white/40 transition-colors duration-200 hover:text-gold"
          >
            <LinkedInIcon className="h-3.5 w-3.5" />
          </a>
        </p>
        <div className="flex items-center gap-4">
          <a
            href={`https://instagram.com/${dict.instagram.replace("@", "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-warm-white/40 transition-colors duration-200 hover:text-gold"
          >
            {dict.instagram}
          </a>
          <LanguageSwitcher tone="light" />
        </div>
      </div>
    </footer>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.15 1.45-2.15 2.94v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}
