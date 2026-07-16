"use client";

import { useState } from "react";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import { PrimaryButton, StepHeading, TextField } from "../drawer-controls";

/**
 * Round 2026-07-17 (Smart Assistant product redesign, per Hamid): the
 * step shown before OTP whenever an AI conversation is needed (the
 * "پرسیدن سؤال" action, or the contextual "قبل از ادامه، سؤالی دارید؟"
 * prompt during booking) — collects name + mobile with his exact required
 * copy, then hands off to the existing OTP flow via `onSubmit` (the
 * drawer wraps this in `runGated`, so submitting here is what actually
 * triggers `PhoneVerificationStep`). Deliberately just two fields — this
 * is NOT `ContactCaptureStep` (which collects the full booking contact
 * form later, after a time preference exists); reusing that component
 * here would drag in city/ageRange/contactMethod/notes fields that don't
 * belong in a "let me ask a quick question" moment.
 */
export function IdentifyStep({
  dict,
  fullName,
  mobile,
  onSubmit,
}: {
  dict: AssistantFlowDictionary;
  fullName: string;
  mobile: string;
  onSubmit: (values: { fullName: string; mobile: string }) => void;
}) {
  const [form, setForm] = useState({ fullName, mobile });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmedName = form.fullName.trim();
    const trimmedMobile = form.mobile.trim();
    if (!trimmedName) {
      setError(dict.validation.fullNameRequired);
      return;
    }
    if (!/^09\d{9}$/.test(trimmedMobile)) {
      setError(dict.validation.mobileInvalid);
      return;
    }
    setError(null);
    onSubmit({ fullName: trimmedName, mobile: trimmedMobile });
  };

  return (
    <div>
      <StepHeading eyebrow={dict.phoneVerification.eyebrow} title={dict.phoneVerification.eyebrow} />
      <p className="text-sm leading-7 text-charcoal/70">{dict.identify.description}</p>
      <div className="mt-4 flex flex-col gap-3.5">
        <TextField
          label={dict.leadForm.fullNameLabel}
          value={form.fullName}
          onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
        />
        <TextField
          label={dict.leadForm.mobileLabel}
          value={form.mobile}
          onChange={(event) => setForm((prev) => ({ ...prev, mobile: event.target.value }))}
          dir="ltr"
          inputMode="tel"
          placeholder="09xxxxxxxxx"
          error={error ?? undefined}
        />
        <PrimaryButton onClick={handleSubmit}>{dict.identify.submitCta}</PrimaryButton>
      </div>
    </div>
  );
}
