"use client";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import type { PaymentCurrency, PaymentDraft } from "../../application/types";
import { PrimaryButton, SelectField, StepHeading } from "../drawer-controls";

/**
 * No payment gateway is integrated (confirmed before writing this file)
 * — per Hamid's explicit spec, this shows the prepared `PaymentDraft`
 * (currency choice only; `amount` stays `null` — no real pricing engine
 * exists either) and the pending-gateway notice, never a "paid" state.
 * The primary button here is what actually submits the whole booking
 * request (lead + triage + appointment preference) via the Server
 * Action — payment intent is captured, not charged.
 */
export function PaymentPreparationStep({
  dict,
  payment,
  onCurrencyChange,
  onSubmit,
  isSubmitting,
}: {
  dict: AssistantFlowDictionary;
  payment: PaymentDraft;
  onCurrencyChange: (currency: PaymentCurrency) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div>
      <StepHeading eyebrow={dict.ui.paymentStepEyebrow} title={dict.payment.heading} />
      <div className="rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3.5">
        <SelectField label={dict.payment.currencyLabel} value={payment.currency} onChange={(e) => onCurrencyChange((e.target as HTMLSelectElement).value as PaymentCurrency)}>
          <option value="IRR">{dict.payment.currencyOptions.IRR}</option>
          <option value="USDT">{dict.payment.currencyOptions.USDT}</option>
        </SelectField>
      </div>
      <p className="mt-3.5 text-xs leading-6 text-charcoal/55">{dict.payment.gatewayPendingNotice}</p>
      <div className="mt-4">
        <PrimaryButton onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? dict.ui.submittingLabel : dict.appointment.submitCta}
        </PrimaryButton>
      </div>
    </div>
  );
}
