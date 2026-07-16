import { prisma } from "@/infrastructure/db/client";
import { getDefaultClinicId } from "@/core/tenancy/clinic";

import type { LeadInfo, LeadStatus, PaymentCurrency, PaymentType, ServiceId, TriageAnswer } from "../application/types";

/**
 * Explicit, clinicId-scoped persistence functions — not a raw Prisma
 * client call from `submit-booking-request.ts`, per CODING_STANDARDS.md
 * §4 and DATABASE_GUIDE.md §1. See docs/adr/0004-assistant-persistence-
 * schema.md for why this is hand-written per-function rather than a
 * generic auto-injecting wrapper (premature for the first real usage).
 *
 * `ensureClinicExists` is called once per submission rather than assumed
 * — no seed script runs automatically in this repo yet, and a booking
 * request must not fail with a foreign-key error just because nobody
 * seeded the one Clinic row. Idempotent (`upsert`), safe to call every time.
 */
async function ensureClinicExists(clinicId: string): Promise<void> {
  await prisma.clinic.upsert({
    where: { id: clinicId },
    update: {},
    create: { id: clinicId, name: "دکتر علیرضا صدیقی" },
  });
}

export async function createLeadWithTriage({
  leadInfo,
  triageAnswers,
  status,
  source,
  locale,
}: {
  leadInfo: LeadInfo;
  triageAnswers: TriageAnswer[];
  status: LeadStatus;
  source: "assistant" | "header" | "homepage" | "floating";
  locale: string;
}) {
  const clinicId = getDefaultClinicId();
  await ensureClinicExists(clinicId);

  const lead = await prisma.lead.create({
    data: {
      clinicId,
      fullName: leadInfo.fullName,
      mobile: leadInfo.mobile,
      city: leadInfo.city || null,
      ageRange: leadInfo.ageRange || null,
      selectedService: leadInfo.selectedService,
      preferredContactMethod: leadInfo.preferredContactMethod ?? undefined,
      notes: leadInfo.notes || null,
      locale,
      source,
      status,
    },
  });

  if (triageAnswers.length > 0 && leadInfo.selectedService) {
    await prisma.triageAnswer.createMany({
      data: triageAnswers.map((answer) => ({
        clinicId,
        leadId: lead.id,
        service: leadInfo.selectedService as ServiceId,
        questionId: answer.questionId,
        questionText: answer.question,
        answer: answer.answer,
      })),
    });
  }

  return lead;
}

export async function createBookingRequestForLead({
  leadId,
  preferredDay,
  preferredTimeRange,
  selectedSlotId,
  appointmentDate,
}: {
  leadId: string;
  preferredDay: string | null;
  preferredTimeRange: string | null;
  selectedSlotId: string | null;
  /** ISO date-only string ("YYYY-MM-DD"), parsed to a UTC-midnight `Date` — must match `availability-scheduler.ts`'s own UTC convention so capacity lookups (which key on this same value) stay consistent. */
  appointmentDate?: string | null;
}) {
  const clinicId = getDefaultClinicId();
  return prisma.bookingRequest.create({
    data: {
      clinicId,
      leadId,
      preferredDate: preferredDay,
      preferredTimeRange,
      selectedSlotId,
      appointmentDate: appointmentDate ? new Date(`${appointmentDate}T00:00:00.000Z`) : null,
      appointmentStatus: "requested",
    },
  });
}

export async function createPaymentDraftForLead({
  leadId,
  bookingRequestId,
  amount,
  currency,
  paymentType,
}: {
  leadId: string;
  bookingRequestId: string;
  amount: number | null;
  currency: PaymentCurrency;
  paymentType: PaymentType;
}) {
  const clinicId = getDefaultClinicId();
  return prisma.paymentDraft.create({
    data: {
      clinicId,
      leadId,
      bookingRequestId,
      amount,
      currency,
      paymentType,
      paymentStatus: "pending",
      paymentProvider: "placeholder",
    },
  });
}

export async function createSmsEvent({
  leadId,
  bookingRequestId,
  eventType,
  payload,
}: {
  leadId: string | null;
  bookingRequestId: string | null;
  eventType: "appointment_requested" | "appointment_confirmed" | "payment_pending" | "payment_success" | "reminder_24h" | "location_sent";
  payload: Record<string, string>;
}) {
  const clinicId = getDefaultClinicId();
  return prisma.smsEvent.create({
    data: {
      clinicId,
      leadId,
      bookingRequestId,
      eventType,
      status: "skipped", // no SMS provider integrated yet — see application/sms-events.ts
      payloadJson: JSON.stringify(payload),
    },
  });
}

/**
 * For the internal admin view — one row per Lead with its latest
 * booking/payment, clinicId-scoped like everything else here.
 *
 * Round 2026-07-17 (Smart Assistant product redesign): `assistantSessions`
 * (with their `messages`) included too, so the page can show whether this
 * lead asked the AI conversation any questions and, if so, let staff
 * expand the transcript — see that page's doc-comment for the "no
 * developer terms, no JSON dumps" presentation rule this feeds.
 */
export async function listLeadsForAdmin() {
  const clinicId = getDefaultClinicId();
  return prisma.lead.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    include: {
      bookingRequests: { orderBy: { createdAt: "desc" }, take: 1 },
      paymentDrafts: { orderBy: { createdAt: "desc" }, take: 1 },
      assistantSessions: { orderBy: { createdAt: "desc" }, include: { messages: { orderBy: { createdAt: "asc" } } } },
    },
  });
}

/**
 * For `/internal/appointments` — one row per `BookingRequest` with its
 * lead's contact/service info, triage answers (for the secretary-facing
 * triage summary column), and latest payment status, clinicId-scoped.
 *
 * Round 2026-07-15 (Clinic Operations Lite): this is no longer purely
 * read-only — see `updateBookingRequestStatus` below — but it is still
 * deliberately NOT a CRM: no bulk actions, no assignment/ownership, no
 * audit trail beyond `updatedAt`, no arbitrary field editing beyond
 * `appointmentStatus`/`internalNote`.
 *
 * Round 2026-07-17 (Smart Assistant product redesign): `lead.assistantSessions`
 * (with `messages`) included too — same conversation-visibility purpose
 * as `listLeadsForAdmin` above.
 */
export async function listBookingRequestsForAdmin() {
  const clinicId = getDefaultClinicId();
  return prisma.bookingRequest.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    include: {
      lead: {
        include: {
          triageAnswers: true,
          assistantSessions: { orderBy: { createdAt: "desc" }, include: { messages: { orderBy: { createdAt: "asc" } } } },
        },
      },
      paymentDrafts: { orderBy: { createdAt: "desc" }, take: 1 },
      // Round 2026-07-15 (availability-based booking): capacity is
      // computed in the page component from this booking's own
      // clinicId-scoped list (count sibling rows sharing the same
      // slot+date) rather than a separate query per row.
      availabilitySlot: true,
    },
  });
}

/**
 * Round 2026-07-16 (contract-alignment pass): the pre-update read
 * `updateAppointmentStatusAction` needs to know the OLD status before
 * calling `updateBookingRequestStatus` below, so it can include both
 * `oldStatus`/`newStatus` in the `appointment.status_changed` automation
 * event — `updateMany` (used for the actual write, for its clinicId-scoped
 * zero-rows-on-mismatch safety) doesn't return the pre-update row, hence
 * this separate read. clinicId-scoped like every other read here.
 */
export async function getBookingRequestForStatusChange(id: string) {
  const clinicId = getDefaultClinicId();
  return prisma.bookingRequest.findFirst({
    where: { id, clinicId },
    select: { id: true, leadId: true, appointmentStatus: true, appointmentDate: true, selectedSlotId: true },
  });
}

/**
 * The one write path `/internal/appointments` gets — updates
 * `appointmentStatus` and/or `internalNote` on a single `BookingRequest`,
 * clinicId-scoped (a mismatched id/clinicId updates zero rows rather than
 * leaking a cross-tenant write). Never called with `appointmentStatus:
 * "confirmed"` by anything except a real secretary action on this page —
 * see `application/types.ts`'s `BookingAppointmentStatus` doc-comment.
 */
export async function updateBookingRequestStatus({
  id,
  appointmentStatus,
  internalNote,
}: {
  id: string;
  appointmentStatus: "requested" | "contacted" | "pending_payment" | "confirmed" | "cancelled";
  internalNote: string | null;
}) {
  const clinicId = getDefaultClinicId();
  return prisma.bookingRequest.updateMany({
    where: { id, clinicId },
    data: { appointmentStatus, internalNote },
  });
}

/** For the dashboard's payments summary card — count only, no payment gateway confirmation exists so this can never mean "paid", only "drafts waiting on a real payment step". */
export async function countPendingPaymentDrafts() {
  const clinicId = getDefaultClinicId();
  return prisma.paymentDraft.count({ where: { clinicId, paymentStatus: "pending" } });
}
