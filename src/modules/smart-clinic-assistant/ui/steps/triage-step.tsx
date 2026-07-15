"use client";

import { useState } from "react";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";

import type { ServiceId, TriageAnswer } from "../../application/types";
import { PrimaryButton, SafetyNotice, StepHeading, TextField } from "../drawer-controls";

/**
 * Renders the selected service's 3–5 screening questions as short text
 * fields, plus the mandatory medical-safety notice (per Hamid's exact
 * wording — never a diagnosis, never a treatment plan, human review
 * always required). Answers are free text, not yes/no — `lead-status.ts`
 * does a simple keyword scan over them, documented there as a blunt
 * heuristic, not medical judgment.
 */
export function TriageStep({
  dict,
  serviceId,
  onComplete,
}: {
  dict: AssistantFlowDictionary;
  serviceId: ServiceId;
  onComplete: (answers: TriageAnswer[]) => void;
}) {
  const questions = dict.triageQuestions[serviceId] ?? [];
  const [values, setValues] = useState<string[]>(() => questions.map(() => ""));
  const serviceLabel = dict.services.find((service) => service.id === serviceId)?.label ?? "";

  const handleSubmit = () => {
    const answers: TriageAnswer[] = questions.map((question, index) => ({
      questionId: `${serviceId}-${index}`,
      question,
      answer: values[index] ?? "",
    }));
    onComplete(answers);
  };

  return (
    <div>
      <StepHeading eyebrow={dict.ui.triageEyebrow} title={serviceLabel} />
      <div className="flex flex-col gap-3.5">
        {questions.map((question, index) => (
          <TextField
            key={question}
            label={question}
            value={values[index] ?? ""}
            onChange={(event) => {
              const next = [...values];
              next[index] = event.target.value;
              setValues(next);
            }}
            placeholder={dict.ui.triageAnswerPlaceholder}
          />
        ))}
      </div>
      <SafetyNotice>{dict.safetyNotice}</SafetyNotice>
      <div className="mt-4">
        <PrimaryButton onClick={handleSubmit}>{dict.leadForm.submitCta}</PrimaryButton>
      </div>
    </div>
  );
}
