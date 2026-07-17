"use server";

import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { isSupportedLocale } from "@/i18n/locales";

import { mobileSchema, normalizeDigits } from "../application/validation";
import { verifyOtpCode } from "./otp/otp-crypto";
import {
  consumeOtpCode,
  createAssistantSession,
  findActiveOtpCode,
  findLatestOtpRequest,
  incrementOtpAttempts,
  MAX_OTP_ATTEMPTS,
} from "./otp/otp-repository";
import { isSmsProviderConfigured } from "./otp/sms-provider";
import { issueDevBypassToken } from "./otp/session-guard";
import type { OtpPurpose } from "./request-otp";

export type VerifyOtpResult =
  | { status: "verified"; sessionToken: string }
  | { status: "invalid_code" }
  | { status: "expired" }
  | { status: "too_many_attempts" }
  | { status: "unavailable" }
  | { status: "invalid_mobile" };

/** `0912***89` — first 4 + last 2 digits only; never the full number, per Hamid's "phoneHash or masked phone only" logging rule. Not reversible enough to identify a patient from a log line alone, but still useful for spotting a repeat-failure pattern in production logs. */
function maskMobile(mobile: string): string {
  return mobile.length <= 6 ? "***" : `${mobile.slice(0, 4)}***${mobile.slice(-2)}`;
}

/**
 * Round 2026-07-19 (OTP UX/verification fix, per Hamid): safe,
 * secret-free diagnostic logging for verification failures — never the
 * code, never the code hash, never the raw request body, never the full
 * phone number. `reason` is one of the five the brief asked for;
 * `stale_code` specifically means "a newer request already superseded
 * this one" (the most likely real-world cause of "I got the SMS but it
 * says wrong" — see `request-otp.ts`'s `invalidatePendingOtpCodes`),
 * distinguished from a genuine `expired`/never-requested case by a
 * cheap follow-up read (`findLatestOtpRequest`), only when
 * `findActiveOtpCode` came back empty.
 */
function logOtpFailure(reason: "expired" | "mismatch" | "no_active_code" | "too_many_attempts" | "stale_code", mobile: string, purpose: OtpPurpose): void {
  console.error("[verify-otp:failed]", { reason, mobile: maskMobile(mobile), purpose });
}

/**
 * Mirrors `requestOtp`'s branching exactly (see docs/adr/0007) — the dev
 * bypass and the real DB-backed path are mutually exclusive, decided the
 * same way in both files, so a code requested via one path can only ever
 * be verified via that same path.
 *
 * Round 2026-07-19 (OTP UX/verification fix, per Hamid — root cause of
 * "user receives SMS code but entering it says the code is wrong"): the
 * submitted code is now digit-normalized (Persian/Arabic-Indic → English)
 * BEFORE hashing/comparison — a code typed on a Persian keyboard using
 * ۰-۹ never matched the English-digit hash before this fix, which is the
 * single most likely real cause of that symptom (the mobile field
 * already normalized this way via `mobileSchema`; the code field simply
 * never did).
 */
export async function verifyOtp(input: { mobile: string; code: string; purpose: OtpPurpose; locale: string }): Promise<VerifyOtpResult> {
  const parsedMobile = mobileSchema.safeParse(input.mobile);
  if (!parsedMobile.success) {
    return { status: "invalid_mobile" };
  }
  const mobile = parsedMobile.data;
  const locale = isSupportedLocale(input.locale) ? input.locale : "fa";
  const code = normalizeDigits(input.code).replace(/\D/g, "");

  if (!isSmsProviderConfigured()) {
    if (process.env.NODE_ENV !== "production" && code === "000000") {
      return { status: "verified", sessionToken: issueDevBypassToken(mobile) };
    }
    return process.env.NODE_ENV !== "production" ? { status: "invalid_code" } : { status: "unavailable" };
  }

  if (!isDatabaseConfigured()) {
    return { status: "unavailable" };
  }

  const otp = await findActiveOtpCode(mobile, input.purpose);
  if (!otp) {
    const latest = await findLatestOtpRequest(mobile, input.purpose);
    logOtpFailure(!latest ? "no_active_code" : latest.consumedAt ? "stale_code" : "expired", mobile, input.purpose);
    return { status: "expired" };
  }
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    logOtpFailure("too_many_attempts", mobile, input.purpose);
    return { status: "too_many_attempts" };
  }

  const isMatch = verifyOtpCode(code, otp.codeHash);
  if (!isMatch) {
    await incrementOtpAttempts(otp.id);
    logOtpFailure("mismatch", mobile, input.purpose);
    return { status: "invalid_code" };
  }

  await consumeOtpCode(otp.id);
  const session = await createAssistantSession({ mobile, locale });
  return { status: "verified", sessionToken: session.id };
}
