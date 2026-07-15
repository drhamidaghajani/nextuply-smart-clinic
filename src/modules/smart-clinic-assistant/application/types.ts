/**
 * Core types for the Smart Clinic Assistant flow (lead intake → triage →
 * service selection → contact capture → appointment request → payment
 * preparation → confirmation), per Hamid's 2026-07-12 contract-driven
 * brief. This module is the public-facing "Smart Clinic Assistant"
 * ("دستیار هوشمند کلینیک دکتر علیرضا صدیقی") — the contract's internal
 * "Closer" reception/triage engine is what this UI feeds, never a name
 * exposed anywhere in this file or its UI.
 *
 * Scope note (repeated at every layer that touches it): no backend exists
 * in this repo yet (no Prisma/Postgres, no payment/SMS provider — see
 * PROJECT_UNDERSTANDING.md §13's open questions). Every type here is the
 * *contract* a future backend will fulfill; nothing in this module claims
 * a confirmed appointment, a completed payment, or a sent SMS.
 */

/** What an external CTA (Header, Footer, homepage section, floating trigger) can seed the assistant with. */
export type AssistantIntent =
  | "general"
  | "consultation_booking"
  | "service_selection"
  | "cost_question"
  | "before_after"
  | "articles"
  | "image_upload_future";

/**
 * The assistant's current position in the flow — a superset of
 * `AssistantIntent`: every intent is a valid starting step, but some
 * steps (triage, contact capture, appointment selection, payment
 * preparation, confirmation) are only ever reached *through* the flow,
 * never seeded directly by an external CTA.
 *
 * `"qa_response"` (docs/adr/0006, AI cost-control pass) is reached only
 * from `GeneralStep`'s free-text input, when the message is classified
 * as an open question rather than mapping to an existing screen.
 *
 * `"phone_verification"` (docs/adr/0007, mobile-verification pass) is
 * reached only when a gated action (free-text ask, completing triage,
 * "general consultation," final submit) is attempted before the mobile
 * is verified — `AssistantDrawer` stores the interrupted action and
 * resumes it on success, never seeded directly by an external CTA.
 */
export type AssistantStep =
  | AssistantIntent
  | "triage"
  | "contact_capture"
  | "appointment_selection"
  | "payment_preparation"
  | "confirmation"
  | "qa_response"
  | "phone_verification"
  /** Round 2026-07-13 (patient-care hub) — deterministic, no AI call; routes to `/care-instructions`. See `assistant-drawer.tsx`. */
  | "care_guidance";

/**
 * Round 2026-07-13 (taxonomy correction, per Hamid): the real service
 * taxonomy is the 6 specialties in `src/content/services.ts`
 * (`SERVICE_TAXONOMY_IDS`) — this list IS that taxonomy plus one
 * non-specialty catch-all (`general_consultation`, used only by the
 * Assistant flow to skip triage entirely — see `computeLeadStatus` and
 * `AssistantDrawer`). One id scheme, not a second one that can drift:
 * the route slug (`/services/[slug]`), the Assistant's stored
 * `selectedService`, and this type are all the same string. No Prisma
 * migration needed — `Lead.selectedService`/`TriageAnswer.service` are
 * plain `String` columns, not a DB enum.
 */
export const SERVICE_IDS = [
  "advanced-dental-implant",
  "impacted-tooth-surgery",
  "facial-rejuvenation",
  "facial-cosmetic-surgery",
  "orthognathic-surgery",
  "rhinoplasty",
  "general_consultation",
] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export type PreferredContactMethod = "phone" | "whatsapp" | "instagram";

/** Which UI entry point opened the assistant — captured once at `open()` time, see `assistant-provider.tsx`. */
export type LeadSource = "assistant" | "header" | "homepage" | "floating";

export interface LeadInfo {
  fullName: string;
  mobile: string;
  city: string;
  ageRange: string;
  selectedService: ServiceId | null;
  preferredContactMethod: PreferredContactMethod | null;
  notes: string;
}

export interface TriageAnswer {
  questionId: string;
  question: string;
  answer: string;
}

export type LeadStatus = "new" | "needs_consultation" | "needs_doctor_review" | "high_intent" | "follow_up_required";

export interface TriageSession {
  serviceId: ServiceId;
  answers: TriageAnswer[];
  completedAt: string | null;
  status: LeadStatus | null;
}

/**
 * A real bookable slot — the shape a future calendar backend would
 * return. Nothing in this codebase currently produces real instances of
 * this (no calendar integration exists yet); see `appointment-selection`
 * step, which falls back to a "preferred time request" flow instead of
 * rendering fabricated slots.
 */
export interface AppointmentSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId: "tabriz" | "tehran";
}

export type AppointmentRequestStatus = "booking_request";

/**
 * Persistence-layer status for a `BookingRequest` row (matches the
 * Prisma `AppointmentStatus` enum exactly) — distinct from
 * `AppointmentRequestStatus` above, which is the UI-facing "this is a
 * request, not a confirmation" marker `submitBookingRequest` has always
 * returned. `"confirmed"` is never set by any code in this repo except
 * the internal `/internal/appointments` secretary-facing status-update
 * Server Action (Clinic Operations Lite, round 2026-07-15) — never
 * automatically, never by the patient-facing assistant flow, per Hamid's
 * explicit "Do not mark appointment as confirmed unless real calendar
 * confirmation exists." `"contacted"` added the same round — the real
 * "we've reached out, not yet confirmed" state the secretary workflow
 * needed.
 */
export type BookingAppointmentStatus = "requested" | "contacted" | "pending_payment" | "confirmed" | "cancelled";

/**
 * What actually gets submitted today: either a real slot pick (once a
 * calendar exists) or a "preferred time" request — either way, status is
 * always `booking_request`, never a confirmed appointment. Confirmation
 * only happens after real clinic staff/backend review.
 */
export interface AppointmentRequest {
  leadInfo: LeadInfo;
  serviceId: ServiceId;
  slot: AppointmentSlot | null;
  preferredDay: string | null;
  preferredTimeRange: string | null;
  status: AppointmentRequestStatus;
  requestedAt: string;
}

export type PaymentCurrency = "IRR" | "USDT";
export type PaymentType = "consultation_fee" | "deposit" | "full_payment";
export type PaymentStatus = "pending" | "paid" | "failed";

/**
 * UI-state only — see `payment-preparation-step.tsx`. No payment
 * provider is integrated, so `paymentStatus` never leaves `"pending"` in
 * this codebase; nothing here is ever submitted anywhere.
 */
export interface PaymentDraft {
  amount: number | null;
  currency: PaymentCurrency;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  paymentProvider: "placeholder";
}

/**
 * SMS integration points — named events a real provider would send on,
 * wired as no-op call sites only (see `application/sms-events.ts`). No
 * SMS provider exists in this repo.
 */
export type SmsEvent = "appointment_requested" | "appointment_confirmed" | "payment_pending" | "payment_success" | "reminder_24h" | "location_sent";
