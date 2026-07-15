import { callAiGateway } from "../../ai/ai-gateway-client";
import type { GenerateLeadSummaryOutput } from "../../ai/types";
import type { LeadStatus, ServiceId, TriageAnswer } from "../../application/types";

export type LeadSummaryResult = GenerateLeadSummaryOutput;

/**
 * Generates a short internal (staff-only, never patient-facing) summary
 * of a submitted lead — called exactly ONCE, from `submit-booking-
 * request.ts`, after a booking request is successfully validated AND
 * session verification has already passed (see that file — this
 * function is only ever reached inside that already-gated path). Never
 * called per-step, never called for the deterministic parts of the flow.
 *
 * Data minimization (see AI_USAGE_NOTES.md for the full policy):
 * intentionally sent: `serviceId` (a bare key, not a translated label),
 * triage question ids + the patient's own free-text answers, age range,
 * preferred-contact-method TYPE (phone/whatsapp/instagram — never the
 * actual phone number/handle), the already-locally-computed
 * `leadStatus`, and the appointment day/time preference. Intentionally
 * NOT sent: full name, mobile number, city, or the patient's free-text
 * `notes` field (that field can incidentally contain a name/number a
 * patient typed themselves — excluded out of caution, not because it
 * was explicitly named in the brief).
 *
 * Failure mode: returns `null` on any failure (not configured, timeout,
 * bad output) — the caller treats a missing summary as "not generated
 * this time," never as a reason to fail the booking itself.
 */
export async function generateLeadSummary({
  serviceId,
  triageAnswers,
  ageRange,
  preferredContactMethod,
  leadStatus,
  preferredDay,
  preferredTimeRange,
  locale,
  sessionVerified,
}: {
  serviceId: ServiceId;
  triageAnswers: TriageAnswer[];
  ageRange: string;
  preferredContactMethod: string | null;
  leadStatus: LeadStatus;
  preferredDay: string | null;
  preferredTimeRange: string | null;
  locale: string;
  sessionVerified: boolean;
}): Promise<LeadSummaryResult | null> {
  const result = await callAiGateway(
    "generate_lead_summary",
    {
      selectedService: serviceId,
      triageAnswers: triageAnswers.map((entry) => ({ questionId: entry.questionId, answer: entry.answer })),
      ageRange: ageRange || null,
      preferredContactMethod,
      leadStatus,
      appointmentPreference: { preferredDay, preferredTimeRange },
      locale,
    },
    { sessionVerified }
  );

  return result.ok ? result.data : null;
}
