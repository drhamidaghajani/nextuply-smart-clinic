"use client";

import { useReducer } from "react";

import type { LeadInfo, PaymentDraft, ServiceId, TriageAnswer } from "../application/types";

/**
 * Session-local flow data (lead info, triage answers, appointment
 * preference, payment draft) — deliberately NOT in `AssistantProvider`
 * (see that file's doc-comment: it stays a small, stable piece every CTA
 * depends on). This resets whenever `AssistantDrawer` remounts; there is
 * no cross-session persistence in this pass — that's a backend-connected
 * concern (real `Conversation` rows), out of scope while no database
 * exists in this repo.
 */
/**
 * Round 2026-07-15 (availability-based booking, per Hamid): `appointment`
 * now optionally carries a real slot pick (`selectedSlotId`/
 * `appointmentDate`) alongside the always-populated `preferredDay`/
 * `preferredTimeRange` human-readable strings — the latter two are set
 * either way (backward-compatible display value for `/internal/
 * appointments`, unchanged from before), the former two only when the
 * patient picked a real availability option rather than falling back to
 * manual entry. See `appointment-selection-step.tsx`.
 */
interface FlowState {
  leadInfo: LeadInfo;
  triageAnswers: TriageAnswer[];
  triageCompleted: boolean;
  appointment: {
    preferredDay: string | null;
    preferredTimeRange: string | null;
    selectedSlotId: string | null;
    appointmentDate: string | null;
  };
  payment: PaymentDraft;
  submittedRequestId: string | null;
}

type FlowAction =
  | { type: "SET_SERVICE"; serviceId: ServiceId }
  | { type: "SET_TRIAGE_ANSWERS"; answers: TriageAnswer[] }
  | { type: "COMPLETE_TRIAGE" }
  | { type: "SET_LEAD_INFO"; leadInfo: Partial<LeadInfo> }
  | {
      type: "SET_APPOINTMENT_PREFERENCE";
      preferredDay: string | null;
      preferredTimeRange: string | null;
      selectedSlotId?: string | null;
      appointmentDate?: string | null;
    }
  | { type: "SET_PAYMENT"; payment: Partial<PaymentDraft> }
  | { type: "SUBMITTED"; requestId: string }
  | { type: "RESET" };

const initialLeadInfo: LeadInfo = {
  fullName: "",
  mobile: "",
  city: "",
  ageRange: "",
  selectedService: null,
  preferredContactMethod: null,
  notes: "",
};

const initialState: FlowState = {
  leadInfo: initialLeadInfo,
  triageAnswers: [],
  triageCompleted: false,
  appointment: { preferredDay: null, preferredTimeRange: null, selectedSlotId: null, appointmentDate: null },
  payment: { amount: null, currency: "IRR", paymentType: "consultation_fee", paymentStatus: "pending", paymentProvider: "placeholder" },
  submittedRequestId: null,
};

function reducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "SET_SERVICE":
      // Changing service invalidates any previous triage answers — they were for a different service's questions.
      return { ...state, leadInfo: { ...state.leadInfo, selectedService: action.serviceId }, triageAnswers: [], triageCompleted: false };
    case "SET_TRIAGE_ANSWERS":
      return { ...state, triageAnswers: action.answers };
    case "COMPLETE_TRIAGE":
      return { ...state, triageCompleted: true };
    case "SET_LEAD_INFO":
      return { ...state, leadInfo: { ...state.leadInfo, ...action.leadInfo } };
    case "SET_APPOINTMENT_PREFERENCE":
      return {
        ...state,
        appointment: {
          preferredDay: action.preferredDay,
          preferredTimeRange: action.preferredTimeRange,
          selectedSlotId: action.selectedSlotId ?? null,
          appointmentDate: action.appointmentDate ?? null,
        },
      };
    case "SET_PAYMENT":
      return { ...state, payment: { ...state.payment, ...action.payment } };
    case "SUBMITTED":
      return { ...state, submittedRequestId: action.requestId };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useAssistantFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}
