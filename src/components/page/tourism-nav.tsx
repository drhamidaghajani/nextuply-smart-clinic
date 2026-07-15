import Link from "next/link";
import type { HealthTourismPageDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

/** Shared sub-nav for the 4 health-tourism pages (overview/visa/hotel/transfer). */
export function TourismNav({
  nav,
  locale,
  active,
}: {
  nav: HealthTourismPageDictionary["nav"];
  locale: Locale;
  active: "overview" | "visa" | "hotel" | "transfer";
}) {
  const tabs = [
    { id: "overview" as const, label: nav.overview, href: `/${locale}/health-tourism` },
    { id: "visa" as const, label: nav.visa, href: `/${locale}/health-tourism/visa` },
    { id: "hotel" as const, label: nav.hotel, href: `/${locale}/health-tourism/hotel` },
    { id: "transfer" as const, label: nav.transfer, href: `/${locale}/health-tourism/transfer` },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-cream px-6 py-6 sm:gap-2.5 sm:px-8">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-200 sm:px-5 sm:text-sm ${
            tab.id === active ? "border-gold bg-gold/10 text-gold" : "border-charcoal/15 text-charcoal/60 hover:border-charcoal/30 hover:text-charcoal"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
