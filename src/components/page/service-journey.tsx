import { Reveal } from "@/components/motion/reveal";

/**
 * Editorial numbered timeline for a service's treatment journey — large
 * ghost numerals + a thin connecting line, replacing the earlier plain
 * bordered-card grid. Deliberately not a "card grid" (per the premium-
 * design brief's explicit instruction) — just type, a hairline, and
 * generous vertical rhythm.
 */
export function ServiceJourney({ steps }: { steps: readonly { title: string; body: string }[] }) {
  return (
    <div className="mx-auto max-w-2xl">
      {steps.map((step, index) => (
        <Reveal key={step.title} delay={index * 0.08}>
          <div className={`flex gap-5 sm:gap-8 ${index < steps.length - 1 ? "pb-8 sm:pb-10" : ""}`}>
            <div className="flex flex-col items-center">
              <span className="font-heading text-2xl font-bold text-gold/40 sm:text-3xl">{String(index + 1).padStart(2, "0")}</span>
              {index < steps.length - 1 ? <span aria-hidden className="mt-2 w-px flex-1 bg-charcoal/10" /> : null}
            </div>
            <div className="pt-1.5">
              <p className="text-sm font-semibold text-charcoal sm:text-base">{step.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-charcoal/65 sm:text-[15px] sm:leading-7">{step.body}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
