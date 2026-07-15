import type { LeadStatus, ServiceId, TriageAnswer } from "./types";

/**
 * Simple, explainable, rule-based status — not AI, not a diagnosis. Per
 * Hamid's explicit medical-safety wording ("این اطلاعات فقط برای
 * غربالگری اولیه... تصمیم نهایی پس از بررسی پزشک انجام می‌شود"), this is
 * an internal reception/triage label used to prioritize which leads a
 * human reviews first — it never reaches the patient, and it never
 * implies a clinical judgment. Keyword matching on free-text answers is
 * a deliberately blunt heuristic (not NLP/AI, none exists in this repo)
 * — false positives just mean an extra human glance at an answer, which
 * is the safe direction to err in for a medical-adjacent flow.
 */
/**
 * Round 2026-07-13 (full locale-rollout round, docs/adr/0006): extended
 * with English/Arabic equivalents — this heuristic runs over whatever
 * language the patient actually typed their triage answers in (now `fa`,
 * `en`, or `ar`), and a Persian-only keyword list would silently stop
 * flagging risk signals for every non-Persian submission. Internal-only,
 * never patient-facing (see doc-comment above) — extending it is a
 * "medically cautious" fix, not a locale-content change.
 */
const RISK_KEYWORDS = [
  // fa
  "بیماری",
  "دارو",
  "درد",
  "حساسیت",
  "محدودیت",
  "مشکل عملکرد",
  "رادیوگرافی",
  // en
  "disease",
  "illness",
  "medication",
  "medicine",
  "pain",
  "allergy",
  "allergic",
  "restriction",
  "limitation",
  "functional problem",
  "x-ray",
  "xray",
  "radiograph",
  // ar
  "مرض",
  "دواء",
  "ألم",
  "حساسية",
  "قيود",
  "محدودية",
  "مشكلة وظيفية",
  "أشعة",
];

export function computeLeadStatus({
  serviceId,
  answers,
  triageCompleted,
}: {
  serviceId: ServiceId | null;
  answers: TriageAnswer[];
  triageCompleted: boolean;
}): LeadStatus {
  if (serviceId === "general_consultation") return "needs_consultation";
  if (!triageCompleted) return "new";

  // `.toLowerCase()` on both sides so English keywords match regardless of
  // capitalization ("Pain"/"pain") — a no-op for Persian/Arabic script.
  const hasRiskSignal = answers.some((entry) => {
    const normalizedAnswer = entry.answer.toLowerCase();
    return RISK_KEYWORDS.some((keyword) => normalizedAnswer.includes(keyword.toLowerCase()));
  });
  if (hasRiskSignal) return "needs_doctor_review";

  return "follow_up_required";
}

/** Called once a lead reaches appointment/contact capture with a completed triage — a stronger intent signal than triage alone. */
export function upgradeToHighIntent(currentStatus: LeadStatus): LeadStatus {
  return currentStatus === "needs_doctor_review" ? currentStatus : "high_intent";
}
