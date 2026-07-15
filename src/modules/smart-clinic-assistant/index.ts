/** Public contract of the smart-clinic-assistant module — see ui/assistant-provider.tsx for the design rationale. */
export { AssistantProvider, useAssistant, ASSISTANT_SECTION_ID, type AssistantIntent, type AssistantStep } from "./ui/assistant-provider";
export { AssistantTriggerButton } from "./ui/assistant-trigger-button";
export { FloatingAssistantTrigger } from "./ui/floating-assistant-trigger";
export { AssistantDrawer } from "./ui/assistant-drawer";
export type {
  LeadInfo,
  TriageAnswer,
  TriageSession,
  LeadStatus,
  ServiceId,
  PreferredContactMethod,
  AppointmentSlot,
  AppointmentRequest,
  PaymentDraft,
  PaymentCurrency,
  PaymentType,
  PaymentStatus,
  SmsEvent,
} from "./application/types";
export { SERVICE_IDS } from "./application/types";
