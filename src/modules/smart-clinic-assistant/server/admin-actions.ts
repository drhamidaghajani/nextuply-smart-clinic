"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { INTERNAL_ADMIN_COOKIE, INTERNAL_ADMIN_COOKIE_MAX_AGE_SECONDS, INTERNAL_USER_SESSION_COOKIE } from "@/core/internal-auth-cookie";
import { sendAutomationEvent } from "@/modules/clinic-operations/server/automation-webhook";
import { deleteInternalUserSession } from "@/modules/internal-ops/server/internal-user-repository";

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

/**
 * Round 2026-07-24 (Internal Operations Lite, Part B): now clears BOTH
 * possible auth cookies, not just the bootstrap one — a real `InternalUser`
 * login never left `INTERNAL_ADMIN_COOKIE` set in the first place, but
 * logging out must be safe to call regardless of which path the current
 * visitor authenticated through (`internal-nav.tsx`'s logout button is
 * shared by both). Also best-effort deletes the DB session row so the
 * SAME session id can't be replayed later even if the cookie were somehow
 * captured — never blocks logout if that delete fails.
 */
export async function internalLogoutAction(locale: string): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(INTERNAL_USER_SESSION_COOKIE)?.value;
  if (sessionId && isDatabaseConfigured()) {
    try {
      await deleteInternalUserSession(sessionId);
    } catch (error) {
      console.error("[internal-logout] session delete failed", error);
    }
  }
  cookieStore.delete(INTERNAL_ADMIN_COOKIE);
  cookieStore.delete(INTERNAL_USER_SESSION_COOKIE);
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

/**
 * Round 2026-07-25 (Internal Operations Lite polish, Part F — bug: "status
 * update does not persist, reverts to the previous status after refresh"):
 * the write itself (`updateBookingRequestStatus`, a clinicId-scoped
 * `updateMany`) was already correct — the actual problem was silent
 * failure with no user-visible signal: every early-return above used a
 * bare `return`, so an unconfigured database, a bad/missing status value,
 * or a thrown DB error all looked EXACTLY like a successful update from
 * the secretary's side (the page just re-rendered with nothing changed —
 * indistinguishable from "it reverted"). Now every failure path
 * `redirect()`s back to `/internal/appointments?statusError=1`, which the
 * page renders as a visible error banner instead of silently no-oping.
 * `redirect()` itself is deliberately called OUTSIDE any try/catch (it
 * works by throwing a special Next.js control-flow signal — catching it
 * would swallow the redirect itself, not the error it's reporting).
 */
export async function updateAppointmentStatusAction(locale: string, bookingRequestId: string, formData: FormData): Promise<void> {
  if (!isDatabaseConfigured()) {
    redirect(`/${locale}/internal/appointments?statusError=1`);
  }

  const statusRaw = formData.get("appointmentStatus");
  const appointmentStatus = VALID_APPOINTMENT_STATUSES.find((status) => status === statusRaw);
  if (!appointmentStatus) {
    redirect(`/${locale}/internal/appointments?statusError=1`);
  }

  const noteRaw = formData.get("internalNote");
  const internalNote = typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim() : null;

  let before: Awaited<ReturnType<typeof getBookingRequestForStatusChange>> = null;
  let writeFailed = false;
  try {
    // Round 2026-07-16 (contract-alignment pass): read the pre-update row
    // so the `appointment.status_changed` automation event below can
    // report both `oldStatus` and `newStatus` — `updateBookingRequestStatus`
    // itself stays an `updateMany` (see its own doc-comment) so this read
    // is kept separate rather than folded in.
    before = await getBookingRequestForStatusChange(bookingRequestId);
    await updateBookingRequestStatus({ id: bookingRequestId, appointmentStatus, internalNote });
  } catch (error) {
    console.error("[update-appointment-status] failed", error);
    writeFailed = true;
  }

  if (writeFailed) {
    redirect(`/${locale}/internal/appointments?statusError=1`);
  }

  revalidatePath(`/${locale}/internal/appointments`);

  if (before && before.appointmentStatus !== appointmentStatus) {
    // Fire-and-forget — see automation-webhook.ts's doc-comment. Never
    // awaited so a slow/unreachable n8n instance can't delay this action.
    void sendAutomationEvent({
      event: "appointment.status_changed",
      clinicId: before.clinicId,
      bookingRequestId,
      leadId: before.leadId,
      fullName: before.lead?.fullName ?? null,
      oldStatus: before.appointmentStatus,
      newStatus: appointmentStatus,
      dashboardUrl: `/${locale}/internal/appointments#booking-${bookingRequestId}`,
    });
  }

  redirect(`/${locale}/internal/appointments?statusUpdated=1#booking-${bookingRequestId}`);
}
