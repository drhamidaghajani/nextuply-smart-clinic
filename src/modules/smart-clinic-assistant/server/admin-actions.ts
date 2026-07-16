"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { INTERNAL_ADMIN_COOKIE, INTERNAL_ADMIN_COOKIE_MAX_AGE_SECONDS } from "@/core/internal-auth-cookie";
import { sendAutomationEvent } from "@/modules/clinic-operations/server/automation-webhook";

import {
  createDoctorAvailabilitySlot,
  setDoctorAvailabilitySlotActive,
  updateDoctorAvailabilitySlot,
} from "./availability-repository";
import { getBookingRequestForStatusChange, updateBookingRequestStatus } from "./lead-repository";
import type { BookingAppointmentStatus } from "../application/types";

/**
 * Login/logout for `/internal/login` (Clinic Operations Dashboard Lite,
 * round 2026-07-15) — sets/clears the EXACT same httpOnly cookie
 * `src/middleware.ts`'s `guardInternalRoute` reads (imported from there,
 * not redefined here, so the two can't drift apart). This is the
 * intended secretary-facing entry point; the middleware's older
 * `?token=` query-param flow still works too (kept for backward
 * compatibility) but this form-based flow is what avoids a raw secret
 * sitting in a URL, browser history, or referrer header.
 *
 * `submitInternalLoginAction` never throws its own error for a bad code
 * — it `redirect()`s back to the login page with `?error=1`, which is
 * itself a Next.js control-flow throw the framework catches, so nothing
 * downstream ever sees or logs the submitted value on failure. The
 * comparison is a plain `===` (not constant-time) — an accepted,
 * already-documented limitation of this whole gate, unchanged from the
 * query-token mechanism it sits alongside.
 */
export async function submitInternalLoginAction(locale: string, formData: FormData): Promise<void> {
  const requiredToken = process.env.INTERNAL_ADMIN_TOKEN;
  const submitted = formData.get("accessCode");

  if (!requiredToken || typeof submitted !== "string" || submitted !== requiredToken) {
    redirect(`/${locale}/internal/login?error=1`);
  }

  const cookieStore = await cookies();
  cookieStore.set(INTERNAL_ADMIN_COOKIE, requiredToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: INTERNAL_ADMIN_COOKIE_MAX_AGE_SECONDS,
  });

  redirect(`/${locale}/internal/dashboard`);
}

export async function internalLogoutAction(locale: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(INTERNAL_ADMIN_COOKIE);
  redirect(`/${locale}/internal/login`);
}

/**
 * Server Actions backing `/internal/availability` and
 * `/internal/appointments`'s write paths (Clinic Operations Lite, round
 * 2026-07-15). Protection is the same `INTERNAL_ADMIN_TOKEN` middleware
 * gate every `/{locale}/internal/*` route already has — a Server Action
 * invoked from a page under that route is itself a request to that same
 * route (Next.js posts actions back to their originating URL), so
 * `src/middleware.ts`'s `guardInternalRoute` already covers these calls;
 * no separate token check is added here, matching how every other
 * `/internal/*` read already relies on that one gate rather than
 * re-checking per-function.
 *
 * Every action no-ops safely (returns without throwing) if
 * `DATABASE_URL` isn't configured — same "never crash, degrade
 * gracefully" rule this codebase applies everywhere else DB access
 * happens. `revalidatePath` after a successful write so the calling
 * page's next render (these routes are already `force-dynamic`) shows
 * the change immediately, no client-side state needed.
 *
 * Round 2026-07-16 (contract-alignment pass, per Hamid):
 * `updateAppointmentStatusAction` now also fires the
 * `appointment.status_changed` automation event (see
 * `clinic-operations/server/automation-webhook.ts`) when the status
 * actually changes — fire-and-forget, no-ops if `N8N_WEBHOOK_URL` is
 * unset.
 */

function parseWeekday(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? n : null;
}

function parseTime(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
}

function parseCapacity(value: FormDataEntryValue | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export async function createAvailabilitySlotAction(locale: string, formData: FormData): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const weekday = parseWeekday(formData.get("weekday"));
  const startTime = parseTime(formData.get("startTime"));
  const endTime = parseTime(formData.get("endTime"));
  if (weekday === null || !startTime || !endTime) return;

  const capacity = parseCapacity(formData.get("capacity"));
  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim() : null;

  await createDoctorAvailabilitySlot({ weekday, startTime, endTime, capacity, note });
  revalidatePath(`/${locale}/internal/availability`);
}

export async function updateAvailabilitySlotAction(locale: string, slotId: string, formData: FormData): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const capacity = parseCapacity(formData.get("capacity"));
  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim() : null;
  const isActive = formData.get("isActive") === "true";

  await updateDoctorAvailabilitySlot({ id: slotId, capacity, note, isActive });
  revalidatePath(`/${locale}/internal/availability`);
}

export async function toggleAvailabilitySlotActiveAction(locale: string, slotId: string, nextActive: boolean): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await setDoctorAvailabilitySlotActive({ id: slotId, isActive: nextActive });
  revalidatePath(`/${locale}/internal/availability`);
}

const VALID_APPOINTMENT_STATUSES: readonly BookingAppointmentStatus[] = [
  "requested",
  "contacted",
  "pending_payment",
  "confirmed",
  "cancelled",
];

export async function updateAppointmentStatusAction(locale: string, bookingRequestId: string, formData: FormData): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const statusRaw = formData.get("appointmentStatus");
  const appointmentStatus = VALID_APPOINTMENT_STATUSES.find((status) => status === statusRaw);
  if (!appointmentStatus) return;

  const noteRaw = formData.get("internalNote");
  const internalNote = typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim() : null;

  // Round 2026-07-16 (contract-alignment pass): read the pre-update row so
  // the `appointment.status_changed` automation event below can report
  // both `oldStatus` and `newStatus` — `updateBookingRequestStatus` itself
  // stays an `updateMany` (see its own doc-comment) so this read is kept
  // separate rather than folded in.
  const before = await getBookingRequestForStatusChange(bookingRequestId);

  await updateBookingRequestStatus({ id: bookingRequestId, appointmentStatus, internalNote });
  revalidatePath(`/${locale}/internal/appointments`);

  if (before && before.appointmentStatus !== appointmentStatus) {
    // Fire-and-forget — see automation-webhook.ts's doc-comment. Never
    // awaited so a slow/unreachable n8n instance can't delay this action.
    void sendAutomationEvent({
      event: "appointment.status_changed",
      bookingRequestId,
      leadId: before.leadId,
      oldStatus: before.appointmentStatus,
      newStatus: appointmentStatus,
      appointmentDate: before.appointmentDate ? before.appointmentDate.toISOString().slice(0, 10) : null,
      selectedSlotId: before.selectedSlotId,
      updatedAt: new Date().toISOString(),
    });
  }
}
