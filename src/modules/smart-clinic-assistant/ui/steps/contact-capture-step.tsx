"use client";

import { useState } from "react";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import { buildLeadInfoSchema } from "../../application/validation";
import type { LeadInfo, PreferredContactMethod } from "../../application/types";
import { PrimaryButton, SelectField, TextAreaField, TextField } from "../drawer-controls";

const CONTACT_METHODS: PreferredContactMethod[] = ["phone", "whatsapp", "instagram"];

/**
 * `fullName`/`mobile` required, validated client-side with the same
 * schema shape the Server Action re-validates server-side (single
 * source of truth for the rule, not duplicated by hand) — see
 * `validation.ts` for why only these two are required.
 *
 * Round 2026-07-13 (docs/adr/0006): the schema is now built from this
 * component's own `dict.validation` messages (`buildLeadInfoSchema`)
 * instead of importing a fixed Persian-message instance, so validation
 * errors are locale-correct on `en`/`ar` too.
 */
export function ContactCaptureStep({
  dict,
  leadInfo,
  onSubmit,
}: {
  dict: AssistantFlowDictionary;
  leadInfo: LeadInfo;
  onSubmit: (leadInfo: LeadInfo) => void;
}) {
  const [form, setForm] = useState(leadInfo);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadInfo, string>>>({});

  const update = <K extends keyof LeadInfo>(key: K, value: LeadInfo[K]) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = () => {
    const leadInfoSchema = buildLeadInfoSchema(dict.validation);
    const result = leadInfoSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LeadInfo, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LeadInfo;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit({ ...form, mobile: result.data.mobile });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <TextField label={dict.leadForm.fullNameLabel} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} error={errors.fullName} />
      <TextField
        label={dict.leadForm.mobileLabel}
        value={form.mobile}
        onChange={(e) => update("mobile", e.target.value)}
        error={errors.mobile}
        dir="ltr"
        inputMode="tel"
        placeholder="09xxxxxxxxx"
      />
      <TextField label={dict.leadForm.cityLabel} value={form.city} onChange={(e) => update("city", e.target.value)} />
      <TextField label={dict.leadForm.ageRangeLabel} value={form.ageRange} onChange={(e) => update("ageRange", e.target.value)} placeholder={dict.leadForm.ageRangePlaceholder} />
      <SelectField
        label={dict.leadForm.contactMethodLabel}
        value={form.preferredContactMethod ?? ""}
        onChange={(e) => update("preferredContactMethod", (e.target as HTMLSelectElement).value as PreferredContactMethod)}
      >
        <option value="" disabled>
          {dict.ui.selectPlaceholder}
        </option>
        {CONTACT_METHODS.map((method) => (
          <option key={method} value={method}>
            {dict.leadForm.contactMethods[method]}
          </option>
        ))}
      </SelectField>
      <TextAreaField label={dict.leadForm.notesLabel} value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
      <PrimaryButton onClick={handleSubmit}>{dict.leadForm.submitCta}</PrimaryButton>
    </div>
  );
}
