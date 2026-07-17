"use client";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import type { ServiceId } from "../../application/types";
import { Chip, OutlineButton, StepHeading } from "../drawer-controls";

/**
 * Round 2026-07-17 (Smart Assistant product redesign, per Hamid — "the
 * final booking confirmation should not feel like a static form"):
 * expanded from a bare heading+body+close button into a real summary —
 * selected service, the chosen/requested time, an honest "pending
 * clinic review" contact-status line (never "confirmed" — no calendar
 * confirmation exists, see `application/types.ts`'s
 * `BookingAppointmentStatus` doc-comment), and a few short, generic,
 * non-medical tips. `onAskAnother` only renders when the patient is both
 * verified and still has AI questions left — asking is a bonus offered
 * here, never implied as available when it isn't.
 *
 * Round 2026-07-20 (production UX fix, item 7 — bug: dates showed as
 * raw Gregorian ISO strings in the Persian UI): takes the already-
 * locale-formatted `displayLabel` directly (from
 * `AppointmentSelectionResult.displayLabel`, Jalali for `fa`) instead of
 * reconstructing display text from raw `preferredDay`/`preferredTimeRange`
 * ISO fields.
 */
export function ConfirmationStep({
  dict,
  serviceId,
  displayLabel,
  canAskAnother,
  onClose,
  onViewCare,
  onAskAnother,
}: {
  dict: AssistantFlowDictionary;
  serviceId: ServiceId | null;
  displayLabel: string | null;
  canAskAnother: boolean;
  onClose: () => void;
  onViewCare: () => void;
  onAskAnother: () => void;
}) {
  const serviceLabel = dict.services.find((service) => service.id === serviceId)?.label ?? null;
  const timeLabel = displayLabel && displayLabel.trim() ? displayLabel : null;

  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div className="mt-4">
        <StepHeading title={dict.confirmation.heading} />
      </div>
      <p className="text-sm leading-7 text-charcoal/65">{dict.confirmation.body}</p>

      <div className="mt-5 rounded-2xl border border-charcoal/10 bg-white p-4 text-start">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold">{dict.confirmation.summaryLabel}</p>
        <dl className="mt-3 flex flex-col gap-2.5 text-sm">
          {serviceLabel ? (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-charcoal/50">{dict.confirmation.serviceLabel}</dt>
              <dd className="font-medium text-charcoal">{serviceLabel}</dd>
            </div>
          ) : null}
          {timeLabel ? (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-charcoal/50">{dict.confirmation.timeLabel}</dt>
              <dd className="font-medium text-charcoal">{timeLabel}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-charcoal/50">{dict.confirmation.contactStatusLabel}</dt>
            <dd className="font-medium text-charcoal">{dict.confirmation.contactStatusValue}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-2xl bg-charcoal/[0.04] p-4 text-start">
        <p className="text-xs font-semibold text-charcoal/60">{dict.confirmation.tipsLabel}</p>
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {dict.confirmation.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-xs leading-6 text-charcoal/60">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <OutlineButton onClick={onClose}>{dict.ui.closeCta}</OutlineButton>
        <div className="flex flex-wrap justify-center gap-2">
          <Chip onClick={onViewCare}>{dict.confirmation.viewCareCta}</Chip>
          {canAskAnother ? <Chip emphasized onClick={onAskAnother}>{dict.confirmation.askAnotherCta}</Chip> : null}
        </div>
      </div>
    </div>
  );
}
