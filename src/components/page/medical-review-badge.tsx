import Link from "next/link";
import { localeHref } from "@/i18n/locale-href";
import type { Locale } from "@/i18n/locales";

const LABEL: Record<Locale, string> = {
  fa: "تأیید و بازبینی پزشکی توسط",
  en: "Medically reviewed by",
  ar: "مراجعة طبية بواسطة",
};

/**
 * Quiet medical-review byline for Knowledge Center articles — same
 * understated, non-boxy tone as `DisclaimerBanner` (a thin gold accent
 * rule, not a "badge" chip), per the premium/calm/medical-trust bar.
 * `reviewerCredentialsRef` on `KnowledgeArticle` only ever points at
 * "about" today (see content/knowledge-articles.ts) — the reviewer name
 * links to the About page's own credential detail rather than repeating
 * it here.
 */
export function MedicalReviewBadge({ reviewerName, locale }: { reviewerName: string; locale: Locale }) {
  return (
    <p className="border-s-2 border-gold/40 ps-4 text-xs leading-6 text-charcoal/60 sm:text-sm">
      {LABEL[locale]}{" "}
      <Link href={localeHref(locale, "/about")} className="font-medium text-gold hover:text-gold-hover">
        {reviewerName}
      </Link>
    </p>
  );
}
