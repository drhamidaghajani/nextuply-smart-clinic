import type { AssistantStep } from "./types";

/**
 * Round 2026-07-17 (Smart Assistant product redesign): extracted from
 * `general-step.tsx` (previously private there) so both the opening menu
 * and the post-OTP AI conversation's follow-up chips route the same
 * action id to the same step, rather than two copies drifting apart.
 * "بررسی شرایط اولیه" routes through `service_selection` first since
 * triage questions are per-service (no service picked yet at this point).
 */
export const ACTION_STEP_MAP: Record<string, AssistantStep> = {
  consultation_booking: "consultation_booking",
  service_selection: "service_selection",
  triage: "service_selection",
  cost_question: "cost_question",
  care_guidance: "care_guidance", // deterministic — see assistant-drawer.tsx, no AI call.
};
