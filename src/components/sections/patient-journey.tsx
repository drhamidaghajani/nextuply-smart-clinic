import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "07 — Patient Journey". Static 4-step layout for
 * now; the GSAP scroll-scrubbed progress line (per the Motion Timeline in
 * HOMEPAGE_STORYBOARD.md §3) is a follow-up polish pass, not this cut.
 */
export function PatientJourney({ dict }: { dict: Dictionary["patientJourney"] }) {
  return (
    <section className="bg-cream px-6 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl">{dict.heading}</h2>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-4">
        {dict.steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.08}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-medium text-warm-white">
                {i + 1}
              </div>
              <h3 className="text-sm font-medium text-charcoal">{step.title}</h3>
              <p className="mt-2 text-xs leading-6 text-charcoal/70">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-10 text-center">
        <a href="#booking" className="text-sm text-gold hover:text-gold-hover">
          {dict.cta} ←
        </a>
      </div>
    </section>
  );
}
