"use client";

import type { ReactNode } from "react";

import { useAssistant, type AssistantIntent, type LeadSource } from "./assistant-provider";

export interface AssistantTriggerButtonProps {
  intent: AssistantIntent;
  /** Which UI entry point this button represents — populates `Lead.source`. Defaults to "assistant" (matches `open()`'s own default). */
  source?: LeadSource;
  className?: string;
  children: ReactNode;
  /** Runs after `open()` — e.g. closing a mobile menu the button lives inside. Optional, additive. */
  onAfterOpen?: () => void;
}

/**
 * Shared client leaf for any CTA that should open the Smart Clinic
 * Assistant with a specific intent (Header CTA, Footer CTA) — kept as a
 * small reusable primitive rather than each caller re-importing
 * `useAssistant` directly, per COMPONENT_GUIDE.md's reuse-over-duplication
 * rule. Unstyled by design (`className` passed through) so each caller's
 * visual context (light header vs. dark footer) controls its own look.
 */
export function AssistantTriggerButton({ intent, source, className, children, onAfterOpen }: AssistantTriggerButtonProps) {
  const { open } = useAssistant();
  return (
    <button
      type="button"
      onClick={() => {
        open(intent, source);
        onAfterOpen?.();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
