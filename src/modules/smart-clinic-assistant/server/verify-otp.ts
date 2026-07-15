"use server";

import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { isSupportedLocale } from "@/i18n/locales";

import { mobileSchema } from "../application/validation";
import { verifyOtpCode } from "./otp/otp-crypto";
import { consumeOtpCode, createAssistantSession, findActiveOtpCode, incrementOtpAttempts, MAX_OTP_ATTEMPTS } from "./otp/otp-repository";
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

/**
 * Mirrors `requestOtp`'s branching exactly (see docs/adr/0007) — the dev
 * bypass and the real DB-backed path are mutually exclusive, decided the
 * same way in both files, so a code requested via one path can only ever
 * be verified via that same path.
 */
export async function verifyOtp(input: { mobile: string; code: string; purpose: OtpPurpose; locale: string }): Promise<VerifyOtpResult> {
  const parsedMobile = mobileSchema.safeParse(input.mobile);
  if (!parsedMobile.success) {
    return { status: "invalid_mobile" };
  }
  const mobile = parsedMobile.data;
  const locale = isSupportedLocale(input.locale) ? input.locale : "fa";

  if (!isSmsProviderConfigured()) {
    if (process.env.NODE_ENV !== "production" && input.code === "000000") {
      return { status: "verified", sessionToken: issueDevBypassToken(mobile) };
    }
    return process.env.NODE_ENV !== "production" ? { status: "invalid_code" } : { status: "unavailable" };
  }

  if (!isDatabaseConfigured()) {
    return { status: "unavailable" };
  }

  const otp = await findActiveOtpCode(mobile, input.purpose);
  if (!otp) {
    return { status: "expired" };
  }
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    return { status: "too_many_attempts" };
  }

  const isMatch = verifyOtpCode(input.code, otp.codeHash);
  if (!isMatch) {
    await incrementOtpAttempts(otp.id);
    return { status: "invalid_code" };
  }

  await consumeOtpCode(otp.id);
  const session = await createAssistantSession({ mobile, locale });
  return { status: "verified", sessionToken: session.id };
}
