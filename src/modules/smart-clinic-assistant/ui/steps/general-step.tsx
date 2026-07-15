"use client";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import type { AssistantStep } from "../../application/types";
import { OutlineButton, PrimaryButton } from "../drawer-controls";

const ACTION_STEP_MAP: Record<string, AssistantStep> = {
  consultation_booking: "consultation_booking",
  service_selection: "service_selection",
  triage: "service_selection", // "بررسی شرایط اولیه" needs a service picked first — triage is per-service.
  cost_question: "cost_question",
  follow_up: "confirmation",
  care_guidance: "care_guidance", // deterministic — see assistant-drawer.tsx, no AI call.
};

/**
 * The assistant's landing view — his exact opening message plus the 5
 * main actions from the brief. "بررسی شرایط اولیه" routes through
 * `service_selection` first since triage questions are per-service (no
 * service picked yet at this point) — flagged here since it's the one
 * action that doesn't map 1:1 to its own step.
 *
 * Round 2026-07-14 (AI cost-control brief, see AI_USAGE_NOTES.md): added
 * a free-text input below the 5 buttons — the ONLY place in this whole
 * module a patient can type an open-ended message.
 *
 * Round 2026-07-14, same day (docs/adr/0007, mobile-verification pass):
 * this component is now purely presentational for the free-text input —
 * `message`/`isAsking`/`unclearMessage` are controlled props, and
 * `onAsk` is a plain synchronous trigger. The actual async
 * `interpretFreeText` call moved up to `AssistantDrawer`, because
 * verification can interrupt it: if the drawer needs to show
 * `PhoneVerificationStep` mid-submit, THIS component unmounts (the
 * drawer swaps steps), so any local state here would be lost. The
 * drawer captures the in-flight message in a closure before navigating
 * away and replays the exact same call after verification succeeds —
 * "resume the exact previous action," not a restart.
 */
export function GeneralStep({
  dict,
  onNavigate,
  message,
  onMessageChange,
  isAsking,
  unclearMessage,
  onAsk,
}: {
  dict: AssistantFlowDictionary;
  onNavigate: (step: AssistantStep) => void;
  message: string;
  onMessageChange: (value: string) => void;
  isAsking: boolean;
  unclearMessage: boolean;
  onAsk: () => void;
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
        <label className="mb-2.5 block text-xs font-medium text-charcoal/55">
          {dict.ui.freeTextSectionLabel}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAsk();
                }
              }}
              placeholder={dict.ui.freeTextPlaceholder}
              disabled={isAsking}
              className="w-full flex-1 rounded-xl border border-charcoal/15 bg-white px-3.5 py-2.5 text-sm font-normal normal-case text-charcoal placeholder:text-charcoal/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
            />
            {/* A raw button, not `PrimaryButton` — that component is
                `w-full` by design (every other caller uses it alone on its
                own row); this is the one place in the drawer a button sits
                inline next to another control, so it needs its own compact
                sizing rather than fighting `PrimaryButton`'s default width
                with a class override (this project has no class-merging
                utility, so a later override isn't guaranteed to win). */}
            <button
              type="button"
              onClick={onAsk}
              disabled={isAsking || !message.trim()}
              className="shrink-0 rounded-full bg-gradient-to-b from-gold to-gold-hover px-4 py-2.5 text-sm font-semibold text-deep-navy transition-[filter] duration-200 hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
            >
              {isAsking ? dict.ui.freeTextThinkingLabel : dict.ui.freeTextSubmitCta}
            </button>
          </div>
        </label>
        {unclearMessage ? <p className="mt-2 text-xs leading-6 text-charcoal/55">{dict.ui.freeTextUnclearMessage}</p> : null}
      </div>
    </div>
  );
}
