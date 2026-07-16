"use server";

import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { isSupportedLocale, type Locale } from "@/i18n/locales";

import { sendAutomationEvent } from "@/modules/clinic-operations/server/automation-webhook";

import { computeLeadStatus } from "../application/lead-status";
import { triggerSmsEvent } from "../application/sms-events";
import type { AppointmentRequest } from "../application/types";
import { buildAppointmentRequestInputSchema, getValidationMessages } from "../application/validation";
import { generateLeadSummary } from "./ai/lead-summary";
import {
  createBookingRequestForLead,
  createLeadWithTriage,
  createPaymentDraftForLead,
  createSmsEvent as persistSmsEvent,
} from "./lead-repository";
import { linkAssistantSessionToBooking } from "./otp/otp-repository";
import { isSessionVerified } from "./otp/session-guard";

/**
 * Server Action (not a Route Handler) — see this file's original
 * doc-comment history for why (API_GUIDELINES.md §1's general rule for
 * in-app form submissions).
 *
 * Round 2026-07-13 (persistence pass, per Hamid — see docs/adr/0004-
 * assistant-persistence-schema.md): real Prisma persistence now exists
 * and IS attempted, but only when `isDatabaseConfigured()` — and even
 * then, wrapped in try/catch. No live database/credentials exist in this
 * environment (confirmed before this round), so persistence will not
 * actually succeed here, but the code path is real and correct, and will
 * start working the moment a real `DATABASE_URL` is configured. A DB
 * failure of any kind (unset, unreachable, schema mismatch) must never
 * crash this patient-facing submission — it degrades to the same
 * validate-and-log behavior this function has always had, and says so
 * honestly via `persisted: false` rather than pretending success.
 *
 * `leadId`/`bookingRequestId` are `null` whenever `persisted` is false —
 * never a fabricated id standing in for a real one.
 *
 * Round 2026-07-16 (contract-alignment pass, per Hamid): fires the
 * `booking.requested` automation event (see
 * `clinic-operations/server/automation-webhook.ts`) once persistence
 * succeeds — fire-and-forget, no-ops if `N8N_WEBHOOK_URL` is unset, never
 * blocks or affects this function's own return value.
 */
/** Last-resort fallback only (zod's own per-field messages, sourced from the submission's locale, cover the real cases) — see `getValidationMessages`. */
const GENERIC_INVALID_MESSAGE: Record<Locale, string> = {
  fa: "اطلاعات ارسال‌شده معتبر نیست.",
  en: "The submitted information is invalid.",
  ar: "المعلومات المُرسلة غير صالحة.",
};

/** Defense-in-depth message only — see the doc-comment on the `isSessionVerified` check below. The UI's own gate should mean a patient basically never sees this. */
const NOT_VERIFIED_MESSAGE: Record<Locale, string> = {
  fa: "برای ثبت درخواست، ابتدا باید شماره موبایل خود را تأیید کنید.",
  en: "Please verify your mobile number before submitting a booking request.",
  ar: "يرجى التحقق من رقم جوالكم قبل إرسال طلب الحجز.",
};

/** Reads `locale`/`sessionToken` off the raw payload before full validation, so both the locale-correct error messages AND the verification check work before the rest of the schema is even evaluated. Defensive `unknown`-narrowing since `rawInput` hasn't been validated yet at this point. */
function detectLocale(rawInput: unknown): Locale {
  if (typeof rawInput === "object" && rawInput !== null && "locale" in rawInput) {
    const value = (rawInput as { locale?: unknown }).locale;
    if (typeof value === "string" && isSupportedLocale(value)) return value;
  }
  return "fa";
}

function detectSessionToken(rawInput: unknown): string | null {
  if (typeof rawInput === "object" && rawInput !== null && "sessionToken" in rawInput) {
    const value = (rawInput as { sessionToken?: unknown }).sessionToken;
    if (typeof value === "string") return value;
  }
  return null;
}

export async function submitBookingRequest(rawInput: unknown): Promise<
  | { ok: true; request: AppointmentRequest; leadId: string | null; bookingRequestId: string | null; persisted: boolean }
  | { ok: false; error: string }
> {
  const locale = detectLocale(rawInput);

  // Round 2026-07-14 (docs/adr/0007): defense-in-depth re-check. The
  // client (`AssistantDrawer`) already gates the final-submit button
  // behind verification — this exists so no code path anywhere can ever
  // persist a real lead/booking without a server-validated session,
  // regardless of how the client got here.
  const sessionToken = detectSessionToken(rawInput);
  const verified = await isSessionVerified(sessionToken);
  if (!verified) {
    return { ok: false, error: NOT_VERIFIED_MESSAGE[locale] };
  }

  const schema = buildAppointmentRequestInputSchema(getValidationMessages(locale));
  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC_INVALID_MESSAGE[locale] };
  }

  const { leadInfo, serviceId, slotId, appointmentDate, preferredDay, preferredTimeRange, triageAnswers, payment, source } = parsed.data;

  const status = computeLeadStatus({ serviceId, answers: triageAnswers, triageCompleted: triageAnswers.length > 0 });

  let leadId: string | null = null;
  let bookingRequestId: string | null = null;
  let persisted = false;

  if (isDatabaseConfigured()) {
    try {
      const lead = await createLeadWithTriage({ leadInfo: { ...leadInfo, selectedService: serviceId }, triageAnswers, status, source, locale });
      leadId = lead.id;

      const bookingRequest = await createBookingRequestForLead({
        leadId: lead.id,
        preferredDay,
        preferredTimeRange,
        selectedSlotId: slotId,
        appointmentDate,
      });
      bookingRequestId = bookingRequest.id;

      const paymentDraft = await createPaymentDraftForLead({
        leadId: lead.id,
        bookingRequestId: bookingRequest.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentType: payment.paymentType,
      });

      await persistSmsEvent({
        leadId: lead.id,
        bookingRequestId: bookingRequest.id,
        eventType: "appointment_requested",
        payload: { mobile: leadInfo.mobile, serviceId },
      });

      persisted = true;

      // Round 2026-07-17 (Smart Assistant product redesign): best-effort
      // link from this verified session to the booking it just produced —
      // see `otp-repository.ts`'s doc-comment. Never blocks/fails the
      // booking itself; a dev-bypass token that never had an AI
      // conversation simply has nothing to link (silent no-op, zero rows
      // matched), not an error.
      if (sessionToken) {
        try {
          await linkAssistantSessionToBooking({ sessionId: sessionToken, leadId: lead.id, bookingRequestId: bookingRequest.id });
        } catch (error) {
          console.error("[booking-request:conversation-link-failed]", error);
        }
      }

      // Fire-and-forget — see automation-webhook.ts's doc-comment for why
      // this is never `await`ed: an unreachable/slow n8n instance must
      // never add latency to this patient-facing submission. No-ops
      // gracefully if N8N_WEBHOOK_URL isn't configured.
      void sendAutomationEvent({
        event: "booking.requested",
        bookingRequestId: bookingRequest.id,
        leadId: lead.id,
        serviceId,
        appointmentDate: bookingRequest.appointmentDate ? bookingRequest.appointmentDate.toISOString().slice(0, 10) : null,
        selectedSlotId: bookingRequest.selectedSlotId,
        preferredDate: bookingRequest.preferredDate,
        preferredTimeRange: bookingRequest.preferredTimeRange,
        appointmentStatus: bookingRequest.appointmentStatus,
        paymentStatus: paymentDraft.paymentStatus,
        createdAt: bookingRequest.createdAt.toISOString(),
      });
    } catch (error) {
      // TODO(backend): surface this to real error monitoring once it
      // exists — for now, visible in the server log only, never thrown
      // back at the patient-facing UI.
      console.error("[booking-request:persist-failed]", error);
    }
  }

  if (!persisted) {
    // Same honest fallback this function has always had — see TODO(backend) above.
    if (process.env.NODE_ENV !== "production") {
      console.log("[booking-request:noop]", {
        fullName: leadInfo.fullName,
        mobile: leadInfo.mobile,
        serviceId,
        reason: isDatabaseConfigured() ? "db-write-failed" : "no-database-configured",
      });
    }
    triggerSmsEvent("appointment_requested", { mobile: leadInfo.mobile, serviceId });
  }

  const request: AppointmentRequest = {
    leadInfo,
    serviceId,
    slot: null,
    preferredDay,
    preferredTimeRange,
    status: "booking_request",
    requestedAt: new Date().toISOString(),
  };

  // Generate the internal (staff-only) lead summary exactly once, here,
  // after the booking request is fully validated — never per-step, never
  // for the deterministic parts of the flow. See AI_USAGE_NOTES.md for
  // exactly what is/isn't sent. `sessionVerified` is `true` here by
  // construction — this line is unreachable unless the check above
  // already passed — passed through explicitly (not re-derived) so
  // `callAiGateway`'s own verification check has a real value to check
  // rather than an assumption. A missing/failed summary never blocks or
  // alters the booking response — it's a best-effort staff aid, logged
  // (not yet persisted — no `Lead.aiSummary`-shaped column exists; adding
  // one is a real, separate schema change not authorized in this pass,
  // same "don't touch DB without a green light" caution this project
  // follows elsewhere) rather than surfaced anywhere patient-facing.
  const aiSummary = await generateLeadSummary({
    serviceId,
    triageAnswers,
    ageRange: leadInfo.ageRange,
    preferredContactMethod: leadInfo.preferredContactMethod,
    leadStatus: status,
    preferredDay,
    preferredTimeRange,
    locale,
    sessionVerified: verified,
  });
  if (aiSummary) {
    console.log("[booking-request:ai-summary]", { leadId, ...aiSummary });
  }

  return { ok: true, request, leadId, bookingRequestId, persisted };
}
