"use client";

import type { ReactNode } from "react";

import { OutlineButton, PrimaryButton, StepHeading } from "../drawer-controls";

/**
 * Shared shell for the 4 simple, non-form intents (`cost_question`,
 * `before_after`, `articles`, `image_upload_future`) — each is a short
 * message plus 1–2 actions, not worth a dedicated file per intent.
 */
export function InfoStep({
  eyebrow,
  title,
  body,
  primaryAction,
  secondaryAction,
}: {
  eyebrow?: string;
  title: string;
  body: ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div>
      <StepHeading eyebrow={eyebrow} title={title} />
      <div className="text-sm leading-7 text-charcoal/70">{body}</div>
      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-col gap-2.5">
          {primaryAction ? <PrimaryButton onClick={primaryAction.onClick}>{primaryAction.label}</PrimaryButton> : null}
          {secondaryAction ? <OutlineButton onClick={secondaryAction.onClick}>{secondaryAction.label}</OutlineButton> : null}
        </div>
      )}
    </div>
  );
}
