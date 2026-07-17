"use server";

import { isDatabaseConfigured } from "@/infrastructure/db/client";

import { mobileSchema } from "../application/validation";
import { generateOtpCode, hashOtpCode } from "./otp/otp-crypto";
import { createOtpCode, findLatestOtpRequest, invalidatePendingOtpCodes, OTP_RESEND_COOLDOWN_SECONDS, OTP_TTL_MINUTES } from "./otp/otp-repository";
import { isSmsProviderConfigured, sendOtpSms } from "./otp/sms-provider";

export type OtpPurpose = "assistant_access" | "booking_request";

/** 6-digit numeric code — see `otp-crypto.ts`'s `generateOtpCode`. Returned to the client (not hardcoded there) so the UI's code field length always matches whatever the server actually generates. */
const OTP_LENGTH = 6;

export type RequestOtpResult =
  | { status: "sent"; issuedAt: string; expiresAt: string; resendAvailableAt: string; otpLength: number }
  /** Dev-only — see `session-guard.ts`'s `issueDevBypassToken`. `devCode` is shown in the UI behind a clearly-labeled dev banner, never presented as if it were a real SMS. */
  | { status: "dev_bypass"; devCode: string; issuedAt: string; expiresAt: string; resendAvailableAt: string; otpLength: number }
  /**
   * Round 2026-07-19 (OTP UX/verification fix) — a resend was requested
   * before the cooldown from the PREVIOUS request elapsed;
   * server-enforced defense-in-depth even though the client already
   * disables the resend action until then. Not an error — the client
   * re-syncs its cooldown timer to `resendAvailableAt`. `expiresAt`/
   * `otpLength` are included (and the client can move straight to the
   * code-entry screen) only when a still-usable code actually exists
   * from that previous request; omitted if it was already
   * consumed/invalidated, in which case the client just waits out the
   * cooldown on the mobile-entry screen.
   */
  | { status: "cooldown"; resendAvailableAt: string; expiresAt?: string; otpLength?: number }
  | { status: "unavailable" }
  | { status: "invalid_mobile" };

/**
 * See docs/adr/0007. Order matters: the dev-bypass check happens BEFORE
 * touching the database at all — in this environment (no SMS provider,
 * often no live `DATABASE_URL` either) that's the only path that can
 * ever return something other than "unavailable", and it's exactly the
 * path this feature is verified through here.
 *
 * Round 2026-07-19 (OTP UX/verification fix, per Hamid — root cause of
 * "user receives SMS code but entering it says the code is wrong"): a
 * new request now (1) enforces a resend cooldown server-side and (2)
 * invalidates any still-pending OTP for the same mobile+purpose before
 * issuing a new one (`invalidatePendingOtpCodes`) — so at most one code
 * is ever valid at a time; an older SMS (delayed in transit, or from an
 * accidental double-request) can never verify a newer session. Also now
 * returns `issuedAt`/`expiresAt`/`resendAvailableAt`/`otpLength` so the
 * client's countdown timers are derived from real server state, not a
 * hardcoded guess.
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
      // reading source. Timestamps are synthesized (not persisted) —
      // this path never touches the database, same as before.
      const devCode = "000000";
      const issuedAt = new Date();
      console.log("[request-otp:dev-bypass] no SMS provider configured — use dev code", { mobile, devCode });
      return {
        status: "dev_bypass",
        devCode,
        issuedAt: issuedAt.toISOString(),
        expiresAt: new Date(issuedAt.getTime() + OTP_TTL_MINUTES * 60_000).toISOString(),
        resendAvailableAt: new Date(issuedAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
        otpLength: OTP_LENGTH,
      };
    }
    return { status: "unavailable" };
  }

  if (!isDatabaseConfigured()) {
    // A real SMS provider with no database to record/verify against
    // isn't a usable state either — verification requires both.
    return { status: "unavailable" };
  }

  const latest = await findLatestOtpRequest(mobile, input.purpose);
  if (latest) {
    const resendAvailableAt = new Date(latest.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    if (resendAvailableAt.getTime() > Date.now()) {
      const stillUsable = !latest.consumedAt && latest.expiresAt.getTime() > Date.now();
      return {
        status: "cooldown",
        resendAvailableAt: resendAvailableAt.toISOString(),
        expiresAt: stillUsable ? latest.expiresAt.toISOString() : undefined,
        otpLength: stillUsable ? OTP_LENGTH : undefined,
      };
    }
  }

  // Round 2026-07-19 — see this function's doc-comment: at most one
  // valid code per mobile+purpose from this point on.
  await invalidatePendingOtpCodes(mobile, input.purpose);

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const otp = await createOtpCode({ mobile, codeHash, purpose: input.purpose });
  // Round 2026-07-14 (real SMS pass): `code` is now actually passed to
  // the provider — a real gap in the previous stub-only version, where
  // the code was generated/hashed/stored but never handed to the send
  // call at all, so no provider could ever have sent a working code even
  // once configured.
  const sendResult = await sendOtpSms(mobile, code);
  if (!sendResult.ok) {
    return { status: "unavailable" };
  }
  return {
    status: "sent",
    issuedAt: otp.createdAt.toISOString(),
    expiresAt: otp.expiresAt.toISOString(),
    resendAvailableAt: new Date(otp.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
    otpLength: OTP_LENGTH,
  };
}
