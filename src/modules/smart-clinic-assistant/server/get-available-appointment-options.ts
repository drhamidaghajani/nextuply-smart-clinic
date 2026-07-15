"use server";

import { getAvailableAppointmentOptions as getOptions, type AvailableAppointmentOption } from "./availability-scheduler";

/**
 * Thin Server Action entry point `AppointmentSelectionStep` (client) calls
 * on mount — same repository-vs-action split as `request-otp.ts` calling
 * into `otp-repository.ts`. Deliberately NOT gated behind OTP/session
 * verification: this only reveals the clinic's own operating-hours
 * pattern and remaining seat counts, not any patient data — comparable to
 * publishing clinic hours, not a privacy-sensitive read.
 */
export async function getAvailableAppointmentOptions(): Promise<AvailableAppointmentOption[]> {
  return getOptions({ daysAhead: 14, maxOptions: 8 });
}
