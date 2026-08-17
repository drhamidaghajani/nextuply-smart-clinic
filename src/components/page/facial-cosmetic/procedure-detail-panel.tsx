import Image from "next/image";

import type { FacialProcedure } from "@/content/facial-cosmetic-procedures";
import type { FacialCosmeticPageDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant/ui/assistant-trigger-button";

/**
 * Round 2026-08-18 (doctor feedback, per Hamid — replacing the previous
 * anchor-scroll-to-a-lower-section UX): the SINGLE source of truth for
 * what "expanded procedure detail" looks like. Rendered by
 * `ProceduresExplorer` — once, in one of two positions depending on
 * viewport (see that file's doc-comment for why there are two mount
 * points rather than one repositioned element). This component itself
 * has no opinion about where it sits; it's pure content.
 *
 * Layout: DOM order is image → title → intro → CTA → detail blocks. On
 * mobile that reads top-to-bottom exactly as authored. From `sm:` up, a
 * two-column grid pulls the blocks row to span full width below the
 * image/title/intro/CTA row — so the CTA still lands directly under the
 * intro on desktop (not literally last in paint order) while nothing
 * needed a second, duplicate CTA or a bespoke `grid-template-areas` swap
 * to get "CTA under intro on desktop, CTA at the very end on mobile"
 * from ONE set of elements in ONE source order.
 */
export function ProcedureDetailPanel({
  procedure,
  locale,
  dict,
  id,
}: {
  procedure: FacialProcedure;
  locale: Locale;
  dict: FacialCosmeticPageDictionary;
  id: string;
}) {
  const blocks: { label: string; items?: readonly string[]; body?: string }[] = [
    { label: dict.suitableForLabel, items: procedure.suitableFor[locale] },
    { label: dict.goalsLabel, items: procedure.goals[locale] },
    { label: dict.processLabel, body: procedure.process[locale] },
    { label: dict.careLabel, items: procedure.care[locale] },
  ];

  return (
    <div
      id={id}
      className="rounded-2xl border border-gold/20 bg-warm-white p-6 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.45)] sm:rounded-[26px] sm:p-8 lg:p-10"
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:items-center sm:gap-10 lg:gap-14">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-cream sm:rounded-[20px]">
          <Image src={procedure.imagePath} alt={procedure.title[locale]} fill sizes="(min-width: 640px) 44vw, 92vw" className="object-cover" />
        </div>

        <div>
          <h3 className="text-balance text-lg font-bold leading-tight text-charcoal sm:text-xl lg:text-[26px]">{procedure.title[locale]}</h3>
          <p className="mt-3.5 text-sm leading-7 text-charcoal/70 sm:text-base sm:leading-8">{procedure.intro[locale]}</p>
          {/* Desktop only — the mobile CTA (same label, same action) sits at the very end of the panel below. */}
          <AssistantTriggerButton
            intent="consultation_booking"
            source="assistant"
            className="mt-6 hidden min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-gold/45 px-6 py-2.5 text-sm font-medium text-gold transition-colors duration-200 hover:bg-gold hover:text-warm-white sm:inline-flex"
          >
            {dict.procedureCta}
          </AssistantTriggerButton>
        </div>
      </div>

      <div className="mt-10 grid gap-x-10 gap-y-8 border-t border-charcoal/10 pt-8 sm:grid-cols-2 sm:pt-10">
        {blocks.map((block) => (
          <div key={block.label}>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold sm:text-xs">{block.label}</h4>
            {block.body ? (
              <p className="mt-3.5 text-[13px] leading-7 text-charcoal/70 sm:text-sm sm:leading-7">{block.body}</p>
            ) : (
              <ul className="mt-3.5 space-y-2.5">
                {block.items?.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-charcoal/70 sm:text-sm sm:leading-7">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold/70 sm:mt-2.5" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Mobile only — desktop already showed this CTA under the intro above. */}
      <AssistantTriggerButton
        intent="consultation_booking"
        source="assistant"
        className="mt-8 flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-gold px-6 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:bg-gold-hover sm:hidden"
      >
        {dict.procedureCta}
      </AssistantTriggerButton>
    </div>
  );
}
