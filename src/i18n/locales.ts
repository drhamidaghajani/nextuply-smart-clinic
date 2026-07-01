export const SUPPORTED_LOCALES = ["fa", "en", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fa";

/** RTL/LTR direction per locale — drives DESIGN_SYSTEM.md §7's logical-property approach. */
export const LOCALE_DIRECTION: Record<Locale, "rtl" | "ltr"> = {
  fa: "rtl",
  ar: "rtl",
  en: "ltr",
};

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
