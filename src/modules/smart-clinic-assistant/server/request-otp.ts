"use server";

import { isDatabaseConfigured } from "@/infrastructure/db/client";

import { mobileSchema } from "../application/validation";
import { generateOtpCode, hashOtpCode } from "./otp/otp-crypto";
import { createOtpCode } from "./otp/otp-repository";
import { isSmsProviderConfigured, sendOtpSms } from "./otp/sms-provider";

export type OtpPurpose = "assistant_access" | "booking_request";

export type RequestOtpResult =
  | { status: "sent" }
  /** Dev-only — see `session-guard.ts`'s `issueDevBypassToken`. `devCode` is shown in the UI behind a clearly-labeled dev banner, never presented as if it were a real SMS. */
  | { status: "dev_bypass"; devCode: string }
  | { status: "unavailable" }
  | { status: "invalid_mobile" };

/**
 * See docs/adr/0007. Order matters: the dev-bypass check happens BEFORE
 * touching the database at all — in this environment (no SMS provider,
 * often no live `DATABASE_URL` either) that's the only path that can
 * ever return something other than "unavailable", and it's exactly the
 * path this feature is verified through here.
 */
export async function requestOtp(input: { mobile: string; purpose: OtpPurpose }): Promise<RequestOtpResult> {
  const parsedMobile = mobileSchema.safeParse(input.mobile);
  if (!parsedMobile.success) {
    return { status: "invalid_mobile" };
  }
  const mobile = parsedMobile.data;

  if (!isSmsProviderConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // Dev bypass — no DB write, no fake "SMS sent" claim. Fixed code,
      // logged once so a developer testing this flow can find it without
      // reading source.
      const devCode = "000000";
      console.log("[request-otp:dev-bypass] no SMS provider configured — use dev code", { mobile, devCode });
      return { status: "dev_bypass", devCode };
    }
    return { status: "unavailable" };
  }

  if (!isDatabaseConfigured()) {
    // A real SMS provider with no database to record/verify against
    // isn't a usable state either — verification requires both.
    return { status: "unavailable" };
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  await createOtpCode({ mobile, codeHash, purpose: input.purpose });
  // Round 2026-07-14 (real SMS pass): `code` is now actually passed to
  // the provider — a real gap in the previous stub-only version, where
  // the code was generated/hashed/stored but never handed to the send
  // call at all, so no provider could ever have sent a working code even
  // once configured.
  const sendResult = await sendOtpSms(mobile, code);
  return sendResult.ok ? { status: "sent" } : { status: "unavailable" };
}
