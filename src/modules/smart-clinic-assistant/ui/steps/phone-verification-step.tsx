"use client";

import { useEffect, useRef, useState } from "react";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

import { normalizeDigits } from "../../application/validation";
import type { OtpPurpose } from "../../server/request-otp";
import { requestOtp } from "../../server/request-otp";
import { verifyOtp } from "../../server/verify-otp";
import { OutlineButton, StepHeading, TextField } from "../drawer-controls";

type Phase = "enter_mobile" | "enter_code";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
/** Countdown display only — `en`/`ar` copy in this codebase already uses Western digits for numbers (see `timeRangeOptions`), `fa` gets its own numerals to match Hamid's exact given example ("مهلت اعتبار کد: ۰۱:۵۸"). */
function toLocaleDigits(raw: string, locale: Locale): string {
  return locale === "fa" ? raw.replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]!) : raw;
}
function formatMMSS(totalSeconds: number, locale: Locale): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60).toString().padStart(2, "0");
  const seconds = Math.floor(clamped % 60).toString().padStart(2, "0");
  return toLocaleDigits(`${minutes}:${seconds}`, locale);
}
function formatSeconds(totalSeconds: number, locale: Locale): string {
  return toLocaleDigits(String(Math.max(0, Math.ceil(totalSeconds))), locale);
}

/** Debounce before auto-verifying a complete code — long enough that a fast typist's last keystroke settles first, short enough to feel instant. */
const AUTO_VERIFY_DEBOUNCE_MS = 300;

/**
 * Shown whenever a gated action is attempted before the mobile is
 * verified — see docs/adr/0007 and `assistant-drawer.tsx`'s `runGated`.
 * `onVerified(sessionToken, mobile)` is the drawer's cue to resume
 * whatever action was interrupted.
 *
 * Round 2026-07-19 (OTP UX/verification fix, per Hamid — production bug:
 * "user receives SMS code but entering it says the code is wrong"):
 * rebuilt the code-entry phase for a real OTP UX:
 * - The code field normalizes Persian/Arabic-Indic digits to English as
 *   typed (`normalizeDigits`, shared with `verify-otp.ts`'s server-side
 *   normalization — see that file's doc-comment for why this was the
 *   likely root cause: a Persian-keyboard-typed code never matched the
 *   English-digit hash before this fix).
 * - Reaching a full code (server-reported `otpLength`, normally 6)
 *   auto-triggers verification after a short debounce — the manual
 *   button is kept only as a fallback, not the primary interaction.
 *   `verifyingGuardRef` prevents a duplicate in-flight request if the
 *   user also taps the button or the code somehow changes again mid-call.
 * - Two independent countdowns, both DERIVED from server timestamps
 *   (`expiresAt`/`resendAvailableAt` — `requestOtp`'s new return fields,
 *   never a hardcoded client-side guess): code expiry (mm:ss) and resend
 *   cooldown (seconds). Resend is disabled until its cooldown elapses;
 *   verifying is blocked once the code has expired, with a clear prompt
 *   to request a new one instead of a confusing "wrong code" error.
 */
export function PhoneVerificationStep({
  dict,
  locale,
  purpose,
  initialMobile,
  onVerified,
  onCancel,
}: {
  dict: AssistantFlowDictionary;
  locale: Locale;
  purpose: OtpPurpose;
  initialMobile?: string;
  onVerified: (sessionToken: string, mobile: string) => void;
  onCancel: () => void;
}) {
  const t = dict.phoneVerification;
  const [phase, setPhase] = useState<Phase>("enter_mobile");
  const [mobile, setMobile] = useState(initialMobile ?? "");
  const [code, setCode] = useState("");
  const [otpLength, setOtpLength] = useState(6);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [serverExpired, setServerExpired] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const verifyingGuardRef = useRef(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const clientExpired = expiresAt !== null && now >= expiresAt;
  const isExpired = clientExpired || serverExpired;
  const resendSecondsLeft = resendAvailableAt ? Math.max(0, (resendAvailableAt - now) / 1000) : 0;

  // Ticks the two countdowns once per second, only while there's something to count down.
  useEffect(() => {
    if (phase !== "enter_code" || (!expiresAt && !resendAvailableAt)) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase, expiresAt, resendAvailableAt]);

  useEffect(() => {
    if (phase === "enter_code") codeInputRef.current?.focus();
  }, [phase]);

  const runVerify = async (candidateCode: string) => {
    if (verifyingGuardRef.current || isExpired) return;
    verifyingGuardRef.current = true;
    setError(null);
    setIsVerifying(true);
    const result = await verifyOtp({ mobile, code: candidateCode, purpose, locale });
    setIsVerifying(false);
    verifyingGuardRef.current = false;

    if (result.status === "verified") {
      onVerified(result.sessionToken, mobile);
      return;
    }
    setCode("");
    if (result.status === "invalid_code") setError(t.invalidCodeMessage);
    else if (result.status === "expired") {
      setError(t.expiredCodeMessage);
      setServerExpired(true);
    } else if (result.status === "too_many_attempts") setError(t.tooManyAttemptsMessage);
    else if (result.status === "invalid_mobile") setError(t.invalidMobileMessage);
    else setError(t.verifyUnavailableMessage);
  };

  // Auto-verify once the normalized code reaches the real OTP length — the manual button below is a fallback only.
  useEffect(() => {
    if (phase !== "enter_code" || isExpired || code.length !== otpLength || verifyingGuardRef.current) return;
    const timer = setTimeout(() => {
      void runVerify(code);
    }, AUTO_VERIFY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, phase, otpLength, isExpired]);

  const handleRequestCode = async () => {
    setError(null);
    setSmsUnavailable(false);
    setIsSending(true);
    const result = await requestOtp({ mobile, purpose });
    setIsSending(false);

    if (result.status === "invalid_mobile") {
      setError(t.invalidMobileMessage);
      return;
    }
    if (result.status === "unavailable") {
      setSmsUnavailable(true);
      return;
    }
    if (result.status === "cooldown") {
      // Defense-in-depth only — the resend action is already disabled
      // client-side until cooldown ends, so this should be rare. Just
      // re-sync rather than show a scary error; if a still-usable code
      // exists from the previous request, land on the code-entry screen
      // for it instead of leaving the user stuck on the mobile screen.
      setResendAvailableAt(new Date(result.resendAvailableAt).getTime());
      if (result.expiresAt && result.otpLength) {
        setOtpLength(result.otpLength);
        setExpiresAt(new Date(result.expiresAt).getTime());
        setServerExpired(false);
        setPhase("enter_code");
      }
      return;
    }

    setCode("");
    setServerExpired(false);
    setOtpLength(result.otpLength);
    setExpiresAt(new Date(result.expiresAt).getTime());
    setResendAvailableAt(new Date(result.resendAvailableAt).getTime());
    setDevHint(result.status === "dev_bypass" ? `${t.devBypassNotice} (${result.devCode})` : null);
    setPhase("enter_code");
  };

  return (
    <div>
      <StepHeading eyebrow={t.eyebrow} title={t.eyebrow} />
      <p className="text-sm leading-7 text-charcoal/70">{t.description}</p>

      {smsUnavailable ? (
        <div className="mt-4 rounded-xl bg-gold/10 px-3.5 py-3 text-xs leading-6 text-charcoal/70">
          {purpose === "booking_request" ? t.smsUnavailableBookingMessage : t.smsUnavailableMessage}
        </div>
      ) : phase === "enter_mobile" ? (
        <div className="mt-4 flex flex-col gap-3.5">
          <TextField
            label={t.mobileLabel}
            value={mobile}
            onChange={(event) => setMobile(normalizeDigits(event.target.value))}
            dir="ltr"
            inputMode="tel"
            placeholder="09xxxxxxxxx"
            error={error ?? undefined}
            autoFocus
          />
          <button
            type="button"
            onClick={() => void handleRequestCode()}
            disabled={isSending || !mobile.trim()}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-b from-gold to-gold-hover px-6 py-3 text-sm font-semibold text-deep-navy transition-[filter] duration-200 hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSending ? t.sendingLabel : t.requestCodeCta}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {devHint ? <p className="rounded-xl bg-charcoal/[0.04] px-3.5 py-3 text-xs leading-6 text-charcoal/60">{devHint}</p> : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-charcoal/70">{t.codeLabel}</span>
            <input
              ref={codeInputRef}
              type="text"
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={otpLength}
              value={code}
              onChange={(event) => setCode(normalizeDigits(event.target.value).replace(/\D/g, "").slice(0, otpLength))}
              placeholder={t.codePlaceholder}
              disabled={isVerifying || isExpired}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-center text-lg tracking-[0.35em] text-charcoal placeholder:text-sm placeholder:tracking-normal placeholder:text-charcoal/30 focus:outline-none focus:ring-1 disabled:opacity-60 ${
                error ? "border-red-300 focus:ring-red-300" : "border-charcoal/15 focus:border-gold focus:ring-gold/40"
              }`}
            />
            {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
          </label>

          {isExpired ? (
            <p className="text-xs font-medium text-red-600">{t.codeExpiredNotice}</p>
          ) : expiresAt !== null ? (
            <p className="text-xs text-charcoal/45">{t.codeExpiryLabel.replace("{time}", formatMMSS((expiresAt - now) / 1000, locale))}</p>
          ) : null}

          {isVerifying ? <p className="text-xs font-medium text-gold">{t.autoVerifyingLabel}</p> : null}

          <OutlineButton onClick={() => void runVerify(code)} disabled={isVerifying || isExpired || code.length !== otpLength} className="mt-1">
            {isVerifying ? t.autoVerifyingLabel : t.verifyCta}
          </OutlineButton>

          <div className="mt-1 flex items-center justify-between text-xs">
            <button type="button" onClick={() => setPhase("enter_mobile")} className="whitespace-nowrap font-medium text-charcoal/50 hover:text-gold">
              {t.changeMobileCta}
            </button>
            {resendSecondsLeft > 0 ? (
              <span className="whitespace-nowrap text-charcoal/40">{t.resendCooldownLabel.replace("{time}", formatSeconds(resendSecondsLeft, locale))}</span>
            ) : (
              <button
                type="button"
                onClick={() => void handleRequestCode()}
                disabled={isSending}
                className="whitespace-nowrap font-medium text-charcoal/50 hover:text-gold disabled:pointer-events-none disabled:opacity-50"
              >
                {t.resendCta}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5">
        <OutlineButton onClick={onCancel}>{dict.ui.backToMenu}</OutlineButton>
      </div>
    </div>
  );
}
