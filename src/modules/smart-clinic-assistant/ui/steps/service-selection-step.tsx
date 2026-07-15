"use client";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import type { ServiceId } from "../../application/types";
import { StepHeading } from "../drawer-controls";

/** `general_consultation` skips triage entirely (no per-service screening questions apply) — handled by the caller checking the id before routing to "triage" vs "contact_capture". */
export function ServiceSelectionStep({
  dict,
  onSelect,
}: {
  dict: AssistantFlowDictionary;
  onSelect: (serviceId: ServiceId) => void;
}) {
  return (
    <div>
      <StepHeading eyebrow={dict.ui.serviceSelectionEyebrow} title={dict.ui.serviceSelectionTitle} />
      <div className="grid grid-cols-2 gap-2.5">
        {dict.services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id as ServiceId)}
            className="text-balance rounded-xl border border-charcoal/15 bg-white px-3 py-3 text-center text-sm font-medium text-charcoal transition-colors duration-200 hover:border-gold hover:text-gold"
          >
            {service.label}
          </button>
        ))}
      </div>
    </div>
  );
}
