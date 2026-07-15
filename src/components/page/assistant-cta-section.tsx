import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant/ui/assistant-trigger-button";
import type { AssistantIntent } from "@/modules/smart-clinic-assistant/application/types";

/**
 * Shared "talk to the Smart Clinic Assistant" CTA block for internal
 * pages — same dark surface as the homepage's Final CTA, reused rather
 * than invented fresh per page. `intent` seeds the drawer (see
 * `AssistantProvider.open`) so a service page can open straight into
 * service selection rather than the generic landing menu.
 *
 * Round 2026-07-13 (design-quality pass): added the same ambient-light
 * glow as `PageHero`/`Hero` (reused, not reinvented) so the page's
 * opening and closing dark moments match, plus an optional secondary
 * plain-link CTA (e.g. Health Tourism's "contact us directly" alongside
 * the Assistant option) — additive, most callers still pass only the
 * primary button.
 *
 * Round 2026-07-13, same day (service-page premium redesign): added
 * `data-header-bg="#0f172a"` — this section's background is always this
 * exact navy gradient regardless of caller, so it's a hardcoded
 * correctness fix for the header's background-color tracker
 * (`use-header-theme.ts`), not a visual or conditional change. Every
 * existing page using this component gets the header reading correctly
 * over this final section instead of keeping whatever light `tone` the
 * previous section left behind.
 */
export function AssistantCtaSection({
  heading,
  body,
  buttonLabel,
  intent = "general",
  secondaryLabel,
  secondaryHref,
}: {
  heading: string;
  body: string;
  buttonLabel: string;
  intent?: AssistantIntent;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section data-header-bg="#0f172a" className="relative overflow-hidden bg-gradient-to-br from-deep-navy to-[#1a2540] px-6 py-20 sm:px-8 sm:py-24">
      <div
        aria-hidden
        className="animate-ambient-light pointer-events-none absolute -top-16 start-1/3 h-[300px] w-[300px] rounded-full bg-gold/15 blur-[100px]"
      />
      <Reveal className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-xl font-bold leading-tight text-warm-white sm:text-2xl lg:text-[28px]">{heading}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-warm-white/70 sm:text-base">{body}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <AssistantTriggerButton
            intent={intent}
            source="assistant"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-gold px-8 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:bg-gold-hover"
          >
            {buttonLabel}
          </AssistantTriggerButton>
          {secondaryLabel && secondaryHref ? (
            <Link
              href={secondaryHref}
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-warm-white/25 px-8 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:border-warm-white/50"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
