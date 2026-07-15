import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";
import { fa } from "./dictionaries/fa";
import type { Locale } from "./locales";

/**
 * The one seam that resolves a `Locale` to its dictionary — see
 * docs/adr/0005-locale-rollout-en-ar.md. `fa` remains the only
 * full-content dictionary; `en`/`ar` cover a critical-path subset
 * (header/footer/hero/assistant basics/holding page) — components that
 * need a section not yet translated should keep reading `fa` directly
 * for now (as most of the homepage body still does), not call this for
 * content that doesn't exist yet.
 */
export function getDictionary(locale: Locale) {
  switch (locale) {
    case "en":
      return en;
    case "ar":
      return ar;
    default:
      return fa;
  }
}
