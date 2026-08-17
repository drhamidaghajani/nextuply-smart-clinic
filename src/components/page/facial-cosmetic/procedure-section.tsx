import Image from "next/image";

import { Reveal } from "@/components/motion/reveal";
import type { FacialProcedure } from "@/content/facial-cosmetic-procedures";
import type { FacialCosmeticPageDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant/ui/assistant-trigger-button";

/**
 * One procedure's own section on the Facial Cosmetic Surgery hub — the
 * anchor target for the nav and overview cards above it.
 *
 * Layout is deliberately two-tier rather than one wide text column:
 * an editorial split at the top (image + title/intro/CTA, mirrored per
 * `reverse` so consecutive sections alternate sides), then the four
 * detail blocks — suitable-for, goals, process, aftercare — in a 2×2
 * grid below it. Seven sections each carrying four bulleted lists would
 * read as a wall of text in a single column; the grid keeps each block
 * scannable and stops any one section from running excessively tall.
 *
 * `scroll-mt-*` clears the fixed site header (`h-[68px]`, `lg:h-[88px]`
 * — see site-header.tsx) so an anchored section lands below it rather
 * than underneath it, with a little breathing room above the heading.
 */
export function ProcedureSection({
  procedure,
  locale,
  dict,
  tone,
  reverse,
}: {
  procedure: FacialProcedure;
  locale: Locale;
  dict: FacialCosmeticPageDictionary;
  tone: "cream" | "warm-white";
  reverse: boolean;
}) {
  const blocks: { label: string; items?: readonly string[]; body?: string }[] = [
    { label: dict.suitableForLabel, items: procedure.suitableFor[locale] },
    { label: dict.goalsLabel, items: procedure.goals[locale] },
    { label: dict.processLabel, body: procedure.process[locale] },
    { label: dict.careLabel, items: procedure.care[locale] },
  ];

  return (
    <section
      id={procedure.id}
      data-header-bg={tone === "cream" ? "#fcfbf4" : "#faf7f1"}
      className={`scroll-mt-24 overflow-hidden px-6 py-16 sm:px-8 sm:py-20 lg:scroll-mt-32 ${tone === "cream" ? "bg-cream" : "bg-warm-white"}`}
    >
      <div className="mx-auto max-w-5xl">
        <div className={`grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
          <Reveal>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-cream shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] sm:rounded-[22px]">
              <Image
                src={procedure.imagePath}
                alt={procedure.title[locale]}
                fill
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="text-balance text-xl font-bold leading-tight text-charcoal sm:text-2xl lg:text-[30px]">{procedure.title[locale]}</h2>
            <p className="mt-4 text-sm leading-7 text-charcoal/70 sm:text-base sm:leading-8">{procedure.intro[locale]}</p>
            <AssistantTriggerButton
              intent="consultation_booking"
              source="assistant"
              className="mt-7 inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-gold/45 px-6 py-2.5 text-[13px] font-medium text-gold transition-colors duration-200 hover:bg-gold hover:text-warm-white sm:text-sm"
            >
              {dict.procedureCta}
            </AssistantTriggerButton>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className="mt-12 grid gap-x-10 gap-y-8 border-t border-charcoal/10 pt-10 sm:mt-14 lg:grid-cols-2">
            {blocks.map((block) => (
              <div key={block.label}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold sm:text-xs">{block.label}</h3>
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
        </Reveal>
      </div>
    </section>
  );
}
