import { z } from "zod";

import { ar } from "@/i18n/dictionaries/ar";
import { en } from "@/i18n/dictionaries/en";
import { fa } from "@/i18n/dictionaries/fa";
import type { Locale } from "@/i18n/locales";

import { SERVICE_IDS } from "./types";

/**
 * Round 2026-07-19 (OTP UX/verification fix, per Hamid): exported — this
 * is now the one shared digit-normalization utility for BOTH the mobile
 * field (already used here, unchanged) and the OTP code field
 * (`verify-otp.ts`/`phone-verification-step.tsx`), per his explicit "one
 * shared normalization utility" requirement, rather than a second
 * near-duplicate implementation. Accepts Persian (۰-۹) and Arabic-Indic
 * (٠-٩) digits, common on a Persian-first mobile keyboard, alongside
 * plain English digits.
 */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .trim();
}

/** `0912xxxxxxx`, `+98912xxxxxxx`, or `0098912xxxxxxx` — the three real-world formats for an Iranian mobile number (the clinic's real-world patient base, regardless of which locale the form is displayed in). */
const IRAN_MOBILE_REGEX = /^(?:0|0098|\+98)?9\d{9}$/;

export interface LeadInfoValidationMessages {
  mobileInvalid: string;
  fullNameRequired: string;
}

/**
 * Round 2026-07-13 (full locale rollout, docs/adr/0006): validation
 * messages are no longer hardcoded Persian literals — every caller
 * supplies its own locale's messages (sourced from
 * `assistantFlow.validation` in each dictionary, single source of truth,
 * same as every other piece of this module's copy). `contact-capture-
 * step.tsx` builds this from its own `dict` prop; `submit-booking-
 * request.ts` builds it from the submission's own `locale` field via
 * `getValidationMessages` below.
 */
/** Standalone mobile validator/normalizer — used by `buildLeadInfoSchema` below, and directly by `server/request-otp.ts`/`verify-otp.ts` (OTP has its own distinct `invalid_mobile` status, so it doesn't need a locale-specific message here, just the normalize+validate logic, single source of truth for the Iranian-mobile pattern). */
export function buildMobileSchema(message: string) {
  return z
    .string()
    .transform(normalizeDigits)
    .refine((value) => IRAN_MOBILE_REGEX.test(value.replace(/[\s-]/g, "")), { message });
}

/** `fa`-message default instance — the OTP flow uses this (it reports invalid-mobile via its own typed status, not this message string). */
export const mobileSchema = buildMobileSchema("شماره موبایل معتبر نیست.");

export function buildLeadInfoSchema(messages: LeadInfoValidationMessages) {
  const mobileSchema = buildMobileSchema(messages.mobileInvalid);

  /**
   * `fullName`/`mobile` required (mobile per Hamid's explicit "Mobile
   * number is required"; fullName because a lead with no name isn't
   * actionable for reception follow-up — a judgment call, flagged in the
   * implementation report, not silently assumed). `city`/`ageRange`/`notes`
   * stay optional — nothing in the brief asked for them to be required,
   * and over-requiring on a first-touch lead form hurts conversion.
   */
  return z.object({
    fullName: z.string().trim().min(2, messages.fullNameRequired),
    mobile: mobileSchema,
    city: z.string().trim().default(""),
    ageRange: z.string().trim().default(""),
    selectedService: z.enum(SERVICE_IDS).nullable().default(null),
    preferredContactMethod: z.enum(["phone", "whatsapp", "instagram"]).nullable().default(null),
    notes: z.string().trim().default(""),
  });
}

const VALIDATION_MESSAGES_BY_LOCALE: Record<Locale, LeadInfoValidationMessages> = {
  fa: fa.assistantFlow.validation,
  en: en.assistantFlow.validation,
  ar: ar.assistantFlow.validation,
};

export function getValidationMessages(locale: Locale): LeadInfoValidationMessages {
  return VALIDATION_MESSAGES_BY_LOCALE[locale] ?? VALIDATION_MESSAGES_BY_LOCALE.fa;
}

/** `fa`-message default instance — kept for any caller that isn't locale-parametrized. Prefer `buildLeadInfoSchema`/`getValidationMessages` for anything user-facing. */
export const leadInfoSchema = buildLeadInfoSchema(VALIDATION_MESSAGES_BY_LOCALE.fa);

const triageAnswerSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  answer: z.string(),
});

/**
 * Round 2026-07-13 (persistence pass): expanded from the original
 * lead+appointment-only shape to also carry `triageAnswers`, `payment`
 * intent, `source` (which UI entry point opened the assistant — see
 * `assistant-provider.tsx`), and `locale` — all needed to populate the
 * new `TriageAnswer`/`PaymentDraft`/`Lead.source`/`Lead.locale` columns.
 * `source`/`locale` default sensibly (`"assistant"`/`"fa"`) since older
 * callers or tests might not always pass them.
 */
export function buildAppointmentRequestInputSchema(messages: LeadInfoValidationMessages) {
  return z.object({
    leadInfo: buildLeadInfoSchema(messages),
    serviceId: z.enum(SERVICE_IDS),
    slotId: z.string().nullable(),
    /** ISO date-only ("YYYY-MM-DD"), set only alongside `slotId` when a real availability option was picked — see `availability-scheduler.ts`. */
    appointmentDate: z.string().trim().nullable().default(null),
    preferredDay: z.string().trim().nullable(),
    preferredTimeRange: z.string().trim().nullable(),
    triageAnswers: z.array(triageAnswerSchema).default([]),
    payment: z.object({
      currency: z.enum(["IRR", "USDT"]),
      paymentType: z.enum(["consultation_fee", "deposit", "full_payment"]),
      amount: z.number().nullable().default(null),
    }),
    source: z.enum(["assistant", "header", "homepage", "floating"]).default("assistant"),
    locale: z.string().default("fa"),
  });
}

/** `fa`-message default instance — kept for any caller that isn't locale-parametrized. `submit-booking-request.ts` builds its own per-submission instance instead. */
export const appointmentRequestInputSchema = buildAppointmentRequestInputSchema(VALIDATION_MESSAGES_BY_LOCALE.fa);

export type AppointmentRequestInput = z.infer<typeof appointmentRequestInputSchema>;
