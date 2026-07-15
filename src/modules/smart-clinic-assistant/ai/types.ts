/**
 * The AI Gateway task contract — the only two task types this app sends
 * anywhere, per Hamid's 2026-07-14 brief. Real "AI Gateway"/n8n service
 * (SYSTEM_ARCHITECTURE.md §6/§8) doesn't exist yet; this is the contract
 * it must fulfill once it does — `ai-gateway-client.ts` posts exactly
 * `{ task, input }` and expects exactly `{ output: <shape below> }` back.
 */

export interface ClassifyAssistantMessageInput {
  locale: string;
  currentStep: string;
  /** A service key (e.g. `"rhinoplasty"`), never a translated label. */
  selectedService: string | null;
  /** Capped by the caller before this is ever built — see `intent-detector.ts`. */
  userMessage: string;
  /**
   * Not the raw session token — verification already happened
   * server-side before this request is ever built (see
   * `ai-gateway-client.ts`'s `sessionVerified` guard). This is a plain
   * boolean for the gateway's own audit logging, not a credential.
   */
  verified: true;
}

export interface ClassifyAssistantMessageOutput {
  intent: "cost_question" | "before_after" | "consultation_booking" | "articles" | "service_selection" | "qa" | "unclear";
  selectedService: string | null;
  /** 0–1. */
  confidence: number;
  shouldAskFollowup: boolean;
  suggestedNextStep: string | null;
  /** True only if the message suggests something needing prompt human/clinical attention — never used to diagnose, only to route conservatively. */
  safetyFlag: boolean;
  /** Present when `intent` is `"qa"` — a short, safe, general answer in the same language as the message. */
  responseText?: string;
}

export interface GenerateLeadSummaryInput {
  selectedService: string;
  triageAnswers: { questionId: string; answer: string }[];
  ageRange: string | null;
  /** Contact-method TYPE only (`"phone"`/`"whatsapp"`/`"instagram"`) — never the actual number/handle. */
  preferredContactMethod: string | null;
  leadStatus: string;
  appointmentPreference: { preferredDay: string | null; preferredTimeRange: string | null };
  locale: string;
}

export interface GenerateLeadSummaryOutput {
  shortSummary: string;
  patientIntent: string;
  selectedService: string;
  riskNotes: string | null;
  suggestedFollowUp: string | null;
  leadPriority: "low" | "medium" | "high";
}

export type GatewayTaskMap = {
  classify_assistant_message: { input: ClassifyAssistantMessageInput; output: ClassifyAssistantMessageOutput };
  generate_lead_summary: { input: GenerateLeadSummaryInput; output: GenerateLeadSummaryOutput };
};

export type GatewayTask = keyof GatewayTaskMap;

export type GatewayResult<T extends GatewayTask> =
  | { ok: true; data: GatewayTaskMap[T]["output"] }
  | { ok: false; reason: "not-verified" | "not-configured" | "timeout" | "http-error" | "network-error" | "invalid-response" };
