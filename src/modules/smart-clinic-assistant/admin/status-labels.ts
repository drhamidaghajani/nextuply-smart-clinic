import type { BookingAppointmentStatus, LeadSource, LeadStatus, PaymentStatus, PreferredContactMethod } from "../application/types";

/**
 * Persian labels for the internal admin leads view only — deliberately
 * NOT added to `fa.ts`, which is scoped to patient-facing site copy (see
 * that file's own doc-comments and docs/adr/0002-fa-first-locale-scope.md).
 * Staff-only vocabulary ("needs doctor review", "payment draft pending")
 * belongs with the admin surface that uses it, not mixed into the
 * dictionary a future translator would work from for the public site.
 */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "جدید",
  needs_consultation: "نیازمند مشاوره",
  needs_doctor_review: "نیازمند بررسی پزشک",
  high_intent: "قصد بالا برای رزرو",
  follow_up_required: "نیازمند پیگیری",
};

export const APPOINTMENT_STATUS_LABELS: Record<BookingAppointmentStatus, string> = {
  requested: "درخواست‌شده",
  contacted: "تماس‌گرفته‌شده",
  pending_payment: "در انتظار پرداخت",
  confirmed: "تأییدشده",
  cancelled: "لغوشده",
};

/** The 4 statuses a secretary can actually set from `/internal/appointments` — `pending_payment` is excluded (see schema.prisma's doc-comment: no payment-gateway integration exists yet to drive it, so it stays a defined-but-unused value rather than something staff can pick by hand). */
export const EDITABLE_APPOINTMENT_STATUSES: readonly BookingAppointmentStatus[] = ["requested", "contacted", "confirmed", "cancelled"];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "در انتظار",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
};

/** `PaymentDraft` is optional per booking (no gateway connected yet — see schema.prisma) — this is the label for "there isn't one", never a raw `null`/`undefined` rendered directly. */
export const PAYMENT_STATUS_NOT_CONNECTED_LABEL = "متصل نیست";

export function paymentStatusLabel(status: PaymentStatus | null | undefined): string {
  if (!status) return PAYMENT_STATUS_NOT_CONNECTED_LABEL;
  return PAYMENT_STATUS_LABELS[status];
}

export const CONTACT_METHOD_LABELS: Record<PreferredContactMethod, string> = {
  phone: "تماس تلفنی",
  whatsapp: "واتساپ",
  instagram: "اینستاگرام",
};

/**
 * Round 2026-07-25 (Internal Operations Lite polish, Part C) — friendly
 * Persian labels for `Lead.source`, so staff never see the raw English
 * enum value ("homepage", "floating", …) anywhere in the UI. `header`
 * (the site header's own consultation CTA) wasn't named in Hamid's given
 * label list — labelled analogously, not left untranslated.
 */
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  assistant: "دستیار هوشمند",
  header: "هدر سایت",
  homepage: "صفحه اصلی",
  floating: "دکمه شناور دستیار",
};

export const UNKNOWN_SOURCE_LABEL = "نامشخص";

export function leadSourceLabel(source: string | null | undefined): string {
  if (!source) return UNKNOWN_SOURCE_LABEL;
  return LEAD_SOURCE_LABELS[source as LeadSource] ?? UNKNOWN_SOURCE_LABEL;
}

/**
 * Round 2026-07-25 (Internal Operations Lite polish, Part C/G) — the one
 * check for "is this the synthetic record `scripts/verify-staging-db.ts`
 * creates," matching that script's EXACT marker values (`fullName`/
 * `notes` both set to the literal string `"STAGING_VERIFICATION_SCRIPT"`,
 * `mobile` always `"0000000000"`) so operational staff views can filter
 * it out by default. Never deletes anything — this is a read-side filter
 * only; the record itself is left exactly as that script's own
 * doc-comment promises ("never auto-deleted... safe to leave or remove
 * manually").
 */
const STAGING_TEST_MARKER = "STAGING_VERIFICATION_SCRIPT";
const STAGING_TEST_MOBILE = "0000000000";

export function isStagingTestRecord(record: { fullName: string; mobile: string }): boolean {
  return record.fullName.includes(STAGING_TEST_MARKER) || record.mobile === STAGING_TEST_MOBILE;
}

/**
 * Round 2026-07-25 (Internal Operations Lite polish, Part F/G) — "نیازمند
 * پیگیری فوری" row/card badge on `/internal/appointments` and
 * `/internal/assistant-leads`: true if ANY of this lead's AI-conversation
 * sessions logged an urgent handoff (`log-handoff.ts`'s `"handoff: "`
 * prefix, filtered to the urgent subset the same way
 * `listRecentUrgentHandoffs` does — every urgent-router reason string
 * contains "فوری", the other handoff triggers never do). Pure, no DB
 * call — reuses the `lead.assistantSessions[].messages` data these pages
 * already fetch for `ConversationTranscript`, not a second query.
 */
export function hasUrgentHandoff(sessions: readonly { messages: readonly { role: string; content: string }[] }[]): boolean {
  return sessions.some((session) => session.messages.some((message) => message.role === "system" && message.content.startsWith("handoff:") && message.content.includes("فوری")));
}
