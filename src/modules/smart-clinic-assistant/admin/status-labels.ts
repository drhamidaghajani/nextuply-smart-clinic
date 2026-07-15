import type { BookingAppointmentStatus, LeadStatus, PaymentStatus, PreferredContactMethod } from "../application/types";

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
  contacted: "تماس گرفته‌شده",
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

export const CONTACT_METHOD_LABELS: Record<PreferredContactMethod, string> = {
  phone: "تماس تلفنی",
  whatsapp: "واتساپ",
  instagram: "اینستاگرام",
};
