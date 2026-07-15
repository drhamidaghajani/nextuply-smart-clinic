/**
 * Medical/consent trust note — required on every service page and the
 * before/after gallery, per Hamid's delivery-mode brief (exact fa/en/ar
 * wording supplied there, reproduced verbatim in each dictionary's
 * `disclaimer` field, not re-typed here — this component only renders
 * whatever string it's given).
 *
 * Round 2026-07-13 (design-quality pass): softened from a boxed/bordered
 * "warning" treatment to a quiet inline note with a thin accent rule —
 * still clearly legible and always present, but reads as calm medical
 * candor rather than a legal-alert box, per the brief's "medical trust,
 * not generic template" direction.
 */
export function DisclaimerBanner({ text, tone = "light" }: { text: string; tone?: "light" | "dark" }) {
  return (
    <p
      className={`mx-auto max-w-2xl border-s-2 border-gold/40 ps-4 text-start text-xs leading-6 sm:text-sm ${
        tone === "dark" ? "text-warm-white/55" : "text-charcoal/55"
      }`}
    >
      {text}
    </p>
  );
}
