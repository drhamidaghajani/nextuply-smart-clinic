"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import type { HeaderDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";
import { resolveNavHref } from "@/i18n/resolve-nav-href";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant";

/**
 * Fullscreen mobile nav overlay — no generic hamburger-sheet library, kept
 * purpose-built and small since this is the only modal-like UI in the
 * project so far (COMPONENT_GUIDE.md's `ui/Sheet` primitive doesn't exist
 * yet; building a generic one is out of this task's scope). Closes on
 * Escape and on backdrop click; body scroll locked while open.
 *
 * Round 2026-07-13 (locale rollout): takes the full `HeaderDictionary`
 * (not just `navItems`) so its own close-menu aria-label and CTA text are
 * locale-driven too, matching `SiteHeader`.
 *
 * Round 2026-07-13, header polish/correction round: `LanguageSwitcher`
 * added above the CTA — a real gap, not a style tweak. `SiteHeader`'s own
 * switcher is `hidden lg:inline-flex` (desktop-only), and this overlay is
 * the ENTIRE nav surface on mobile, so there was previously no way at all
 * to change language on a phone short of hand-editing the URL. Always
 * `tone="light"` (this overlay is unconditionally `bg-deep-navy`, unlike
 * the header, which tracks the active section).
 */
export function MobileMenu({
  isOpen,
  onClose,
  dict,
  locale,
}: {
  isOpen: boolean;
  onClose: () => void;
  dict: HeaderDictionary;
  locale: Locale;
}) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col bg-deep-navy"
        >
          <div className="flex items-center justify-end px-4 py-4">
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.closeMenuLabel}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-warm-white/15 text-warm-white transition-colors duration-200 hover:border-gold/50 hover:text-gold"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-center justify-center gap-7 px-6">
            {dict.navItems.map((item, index) => (
              <motion.a
                key={item.href}
                href={resolveNavHref(item.href, locale)}
                onClick={onClose}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, delay: shouldReduceMotion ? 0 : 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
                className="text-balance text-center text-xl font-semibold text-warm-white transition-colors duration-200 hover:text-gold"
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-5 px-6 pb-10">
            <LanguageSwitcher tone="light" />
            <AssistantTriggerButton
              intent="consultation_booking"
              source="header"
              onAfterOpen={onClose}
              className="block w-full rounded-full bg-gradient-to-b from-gold to-gold-hover px-6 py-3.5 text-center text-sm font-semibold text-deep-navy"
            >
              {dict.ctaLabel}
            </AssistantTriggerButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
