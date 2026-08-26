import type { FacialProcedure } from "@/content/facial-cosmetic-procedures";
import type { FacialCosmeticPageDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant/ui/assistant-trigger-button";

/** SUPERSEDED (2026-08-26) — see `procedures-explorer.tsx`'s own doc-comment; kept per "do not delete files," no longer imported by any page. */
/**
 * The expanded body of ONE procedure card — rendered inside that card's
 * own border by `ProcedureOverviewCard`, never as a standalone panel.
 *
 * Round 2026-08-18 (second pass, per Hamid — the first pass mounted this
 * as a shared panel under the whole grid on desktop, which read as a
 * detached block): rebuilt as in-card content. Concretely that means it
 * no longer carries its own card chrome (border/background/shadow/large
 * padding) — the card already provides all of that, and nesting a second
 * bordered surface inside a bordered card is exactly what made it look
 * like a separate section. It also no longer repeats the procedure image
 * or title: both are already at the top of the very card this sits in.
 *
 * Blocks stay in one stacked column at every breakpoint. A 2-up grid was
 * considered, but each card is roughly a third of a 1152px container on
 * `lg` (~350px), so two columns of bullets inside it would be ~165px
 * wide — cramped, not premium. Stacking is the correct call at this
 * width, not a shortcut.
 */
export function ProcedureDetailPanel({
  procedure,
  locale,
  dict,
}: {
  procedure: FacialProcedure;
  locale: Locale;
  dict: FacialCosmeticPageDictionary;
}) {
  const blocks: { label: string; items?: readonly string[]; body?: string }[] = [
    { label: dict.suitableForLabel, items: procedure.suitableFor[locale] },
    { label: dict.goalsLabel, items: procedure.goals[locale] },
    { label: dict.processLabel, body: procedure.process[locale] },
    { label: dict.careLabel, items: procedure.care[locale] },
  ];

  return (
    <div>
      <p className="text-[13px] leading-7 text-charcoal/70 sm:text-sm sm:leading-7">{procedure.intro[locale]}</p>

      <div className="mt-6 space-y-5">
        {blocks.map((block) => (
          <div key={block.label}>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold sm:text-[11px]">{block.label}</h4>
            {block.body ? (
              <p className="mt-2.5 text-[13px] leading-6 text-charcoal/70">{block.body}</p>
            ) : (
              <ul className="mt-2.5 space-y-2">
                {block.items?.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-charcoal/70">
                    <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <AssistantTriggerButton
        intent="consultation_booking"
        source="assistant"
        className="mt-7 flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-gold px-5 py-3 text-[13px] font-medium text-warm-white transition-colors duration-200 hover:bg-gold-hover"
      >
        {dict.procedureCta}
      </AssistantTriggerButton>
    </div>
  );
}
