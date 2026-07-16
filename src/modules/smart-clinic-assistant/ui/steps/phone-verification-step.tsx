"use client";

import { useState } from "react";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

import type { OtpPurpose } from "../../server/request-otp";
import { requestOtp } from "../../server/request-otp";
import { verifyOtp } from "../../server/verify-otp";
import { OutlineButton, StepHeading, TextField } from "../drawer-controls";

type Phase = "enter_mobile" | "enter_code";

/**
 * Shown whenever a gated action (free-text ask, completing triage,
 * "general consultation," final submit) is attempted before the mobile
 * is verified — see docs/adr/0007 and `assistant-drawer.tsx`'s
 * `runGated`. Deliberately calm/explanatory, not a login wall: one
 * sentence of "why," a mobile field, a code field, nothing else.
 *
 * `onVerified(sessionToken, mobile)` is the drawer's cue to resume
 * whatever action was interrupted — this component itself has no idea
 * what that action was, keeping it a plain, reusable verification form.
 *
 * Round 2026-07-16 (contract-alignment pass): reached only after
 * `ContactCaptureStep` (name/mobile) for the booking flow now — see
 * `assistant-drawer.tsx`'s doc-comment — so `initialMobile` pre-fills the
 * field instead of asking a second time; still editable (a typo caught
 * here shouldn't require backing all the way out). Also shows a
 * `purpose`-specific SMS-unavailable message: the booking-submit case
 * gets a message naming that specific step, since "SMS unavailable" mid-
 * booking is a more consequential dead end than mid free-text-question.
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
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);

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
    if (result.status === "dev_bypass") {
      setDevHint(`${t.devBypassNotice} (${result.devCode})`);
      setPhase("enter_code");
      return;
    }
    // "sent"
    setDevHint(null);
    setPhase("enter_code");
  };

  const handleVerify = async () => {
    setError(null);
    setIsVerifying(true);
    const result = await verifyOtp({ mobile, code, purpose, locale });
    setIsVerifying(false);

    if (result.status === "verified") {
      onVerified(result.sessionToken, mobile);
      return;
    }
    if (result.status === "invalid_code") setError(t.invalidCodeMessage);
    else if (result.status === "expired") setError(t.expiredCodeMessage);
    else if (result.status === "too_many_attempts") setError(t.tooManyAttemptsMessage);
    else if (result.status === "invalid_mobile") setError(t.invalidMobileMessage);
    else setSmsUnavailable(true);
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
            onChange={(event) => setMobile(event.target.value)}
            dir="ltr"
            inputMode="tel"
            placeholder="09xxxxxxxxx"
            error={error ?? undefined}
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
        <div className="mt-4 flex flex-col gap-3.5">
          {devHint ? <p className="rounded-xl bg-charcoal/[0.04] px-3.5 py-3 text-xs leading-6 text-charcoal/60">{devHint}</p> : null}
          <TextField
            label={t.codeLabel}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            dir="ltr"
            inputMode="numeric"
            maxLength={6}
            placeholder={t.codePlaceholder}
            error={error ?? undefined}
          />
          <button
            type="button"
            onClick={() => void handleVerify()}
            disabled={isVerifying || !code.trim()}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-b from-gold to-gold-hover px-6 py-3 text-sm font-semibold text-deep-navy transition-[filter] duration-200 hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
          >
            {isVerifying ? t.verifyingLabel : t.verifyCta}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button type="button" onClick={() => setPhase("enter_mobile")} className="whitespace-nowrap font-medium text-charcoal/50 hover:text-gold">
              {t.changeMobileCta}
            </button>
            <button type="button" onClick={() => void handleRequestCode()} className="whitespace-nowrap font-medium text-charcoal/50 hover:text-gold">
              {t.resendCta}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5">
        <OutlineButton onClick={onCancel}>{dict.ui.backToMenu}</OutlineButton>
      </div>
    </div>
  );
}
