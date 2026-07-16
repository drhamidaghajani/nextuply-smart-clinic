"use client";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import { ACTION_STEP_MAP } from "../../application/action-step-map";
import type { AssistantStep } from "../../application/types";
import { OutlineButton, PrimaryButton } from "../drawer-controls";

/**
 * The assistant's landing view — his exact opening message plus the 5
 * main actions from the brief.
 *
 * Round 2026-07-17 (Smart Assistant product redesign, per Hamid — "the
 * assistant still feels like a guided form, not a real smart assistant.
 * The free-text input before identifying the user is also meaningless
 * and should not exist in the initial state."): the always-visible
 * free-text composer that used to sit below the 5 buttons is REMOVED
 * entirely from this unauthenticated view — see `ai-conversation-step.tsx`
 * for where free-text now lives (post-OTP only, up to 3 questions). In
 * its place: one deliberate, distinct "پرسیدن سؤال" action (`onAskQuestion`)
 * that starts the identify→OTP→AI-conversation path — a real decision to
 * ask something, not a composer sitting open by default.
 */
export function GeneralStep({
  dict,
  onNavigate,
  onAskQuestion,
}: {
  dict: AssistantFlowDictionary;
  onNavigate: (step: AssistantStep) => void;
  onAskQuestion: () => void;
}) {
  return (
    <div>
      <p className="text-sm leading-7 text-charcoal/75">{dict.openingMessage}</p>
      <div className="mt-5 flex flex-col gap-2.5">
        {dict.mainActions.map((action, index) => {
          const targetStep = ACTION_STEP_MAP[action.id] ?? "general";
          const ButtonComponent = index === 0 ? PrimaryButton : OutlineButton;
          return (
            <ButtonComponent key={action.id} onClick={() => onNavigate(targetStep)}>
              {action.label}
            </ButtonComponent>
          );
        })}
      </div>

      <div className="mt-6 border-t border-charcoal/10 pt-5">
        <button
          type="button"
          onClick={onAskQuestion}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-charcoal/20 px-6 py-3 text-sm font-medium text-charcoal/70 transition-colors duration-200 hover:border-gold hover:text-gold"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M8.5 9.5a3.5 3.5 0 1 1 5.5 2.9c-.9.6-1.5 1.1-1.5 2.1" />
            <path d="M12 17.5h.01" />
          </svg>
          {dict.ui.askQuestionCta}
        </button>
      </div>
    </div>
  );
}
