"use client";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import { OutlineButton, StepHeading } from "../drawer-controls";

export function ConfirmationStep({ dict, onClose }: { dict: AssistantFlowDictionary; onClose: () => void }) {
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
      <p className="mt-3 text-xs leading-6 text-charcoal/45">{dict.appointment.requestSubmittedNotice}</p>
      <div className="mt-5">
        <OutlineButton onClick={onClose}>{dict.ui.closeCta}</OutlineButton>
      </div>
    </div>
  );
}
