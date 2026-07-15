"use client";

import { createContext, useCallback, useContext, useState } from "react";

import type { Locale } from "@/i18n/locales";

import type { AssistantIntent, AssistantStep, LeadSource } from "../application/types";

export type { AssistantIntent, AssistantStep, LeadSource } from "../application/types";

/**
 * Global, mount-once state for the Smart Clinic Assistant. Holds only
 * "is it open" + "which step is it on" — the actual flow data (lead
 * info, triage answers, selected service, appointment/payment drafts)
 * lives in `AssistantDrawer`'s own local reducer (`use-assistant-flow.ts`),
 * not here, so this provider stays a small, stable piece every CTA on
 * the site can safely depend on without pulling in the whole flow.
 *
 * Round 2026-07-12 (per Hamid's contract-driven brief — building the
 * real assistant drawer this file's own TODO had been pointing at):
 * `open(intent)` now sets `step` to that same intent — every
 * `AssistantIntent` is a valid starting `AssistantStep` (see
 * `application/types.ts`) — and no longer falls back to scrolling, since
 * `AssistantDrawer` now actually exists and is mounted in the root
 * layout. `intent` is kept alongside `step` (not replaced by it) since a
 * few UI bits (e.g. which homepage chip is "active") still care about the
 * originating intent specifically, not the current mid-flow step.
 */

export const ASSISTANT_SECTION_ID = "smart-clinic-assistant";

interface AssistantContextValue {
  isOpen: boolean;
  intent: AssistantIntent;
  step: AssistantStep;
  /** Which UI entry point opened the assistant this session — captured once at `open()`, used to populate `Lead.source`. */
  source: LeadSource;
  /** The route locale the assistant was mounted under — see `layout.tsx`. Drives `AssistantDrawer`'s dictionary selection (docs/adr/0006). */
  locale: Locale;
  setStep: (step: AssistantStep) => void;
  open: (intent?: AssistantIntent, source?: LeadSource) => void;
  close: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [intent, setIntent] = useState<AssistantIntent>("general");
  const [step, setStep] = useState<AssistantStep>("general");
  const [source, setSource] = useState<LeadSource>("assistant");

  const open = useCallback((nextIntent: AssistantIntent = "general", nextSource: LeadSource = "assistant") => {
    setIntent(nextIntent);
    setStep(nextIntent);
    setSource(nextSource);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return <AssistantContext.Provider value={{ isOpen, intent, step, source, locale, setStep, open, close }}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within an AssistantProvider");
  }
  return ctx;
}
