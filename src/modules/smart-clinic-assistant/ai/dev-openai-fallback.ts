import { getOpenAiModel } from "./config";
import type {
  ClassifyAssistantMessageInput,
  ClassifyAssistantMessageOutput,
  GatewayResult,
  GenerateLeadSummaryInput,
  GenerateLeadSummaryOutput,
} from "./types";

/**
 * ⚠️ THE ONLY FILE IN THIS MODULE THAT KNOWS OPENAI EXISTS.
 *
 * Reached only from `ai-gateway-client.ts`, only when `isDirectOpenAiDevAllowed()`
 * is true (structurally impossible in production — see `config.ts`).
 * `ai-gateway-client.ts` itself, and every caller above it
 * (`intent-detector.ts`, `lead-summary.ts`), only ever see the neutral
 * `GatewayResult<T>` shape — none of them import anything OpenAI-specific,
 * so swapping this file out (or deleting it once a real gateway exists
 * everywhere) doesn't touch any other file.
 *
 * Builds its own task-specific prompts, since a real gateway would have
 * its own internal prompt logic we don't write — this file's prompts are
 * this project's best-effort stand-in for local testing only.
 */

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 5000;

async function callOpenAiChatJson({
  systemPrompt,
  userMessage,
  maxTokens,
}: {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
}): Promise<{ ok: true; content: string } | { ok: false; reason: "timeout" | "http-error" | "network-error" | "invalid-response" }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: getOpenAiModel(),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[dev-openai-fallback] non-2xx response", response.status);
      return { ok: false, reason: "http-error" };
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { ok: false, reason: "invalid-response" };
    return { ok: true, content };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("[dev-openai-fallback] request failed", isAbort ? "timeout" : error);
    return { ok: false, reason: isAbort ? "timeout" : "network-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}

const ROUTABLE_STEPS = ["cost_question", "before_after", "consultation_booking", "articles", "service_selection"] as const;

export async function classifyViaDevOpenAi(input: ClassifyAssistantMessageInput): Promise<GatewayResult<"classify_assistant_message">> {
  const systemPrompt = [
    "You are an intent router for a medical aesthetic clinic's booking assistant. The sender is already a verified patient.",
    `Reply as JSON only, exactly this shape: {"intent":"${ROUTABLE_STEPS.join('"|"')}"|"qa"|"unclear","selectedService":"<service key or null>","confidence":<0-1 number>,"shouldAskFollowup":<boolean>,"suggestedNextStep":"<step key or null>","safetyFlag":<boolean>,"responseText":"<only if intent is qa: max 2 short sentences, same language as the message, never a diagnosis, never specific pricing>"}.`,
    `Set "safetyFlag" true only if the message suggests something needing prompt clinical attention.`,
    `Reply in the message's own language when writing "responseText".`,
  ].join(" ");

  const result = await callOpenAiChatJson({
    systemPrompt,
    userMessage: JSON.stringify(input),
    maxTokens: 220,
  });
  if (!result.ok) return { ok: false, reason: result.reason };

  try {
    const parsed = JSON.parse(result.content) as Partial<ClassifyAssistantMessageOutput>;
    if (!parsed.intent) return { ok: false, reason: "invalid-response" };
    return {
      ok: true,
      data: {
        intent: parsed.intent,
        selectedService: parsed.selectedService ?? null,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        shouldAskFollowup: Boolean(parsed.shouldAskFollowup),
        suggestedNextStep: parsed.suggestedNextStep ?? null,
        safetyFlag: Boolean(parsed.safetyFlag),
        responseText: parsed.responseText,
      },
    };
  } catch (error) {
    console.error("[dev-openai-fallback] classify parse failed", error);
    return { ok: false, reason: "invalid-response" };
  }
}

export async function summarizeViaDevOpenAi(input: GenerateLeadSummaryInput): Promise<GatewayResult<"generate_lead_summary">> {
  const systemPrompt = [
    "You write a short internal note for clinic reception staff, never seen by the patient.",
    'Reply as JSON only, exactly this shape: {"shortSummary":"<2-3 sentences>","patientIntent":"<short phrase>","selectedService":"<echo the input service key>","riskNotes":"<short text or null>","suggestedFollowUp":"<short text or null>","leadPriority":"low"|"medium"|"high"}.',
    "Never invent facts not present in the input. Never write a diagnosis. Reply in the same language as the triage answers when possible, otherwise Persian.",
  ].join(" ");

  const result = await callOpenAiChatJson({
    systemPrompt,
    userMessage: JSON.stringify(input),
    maxTokens: 220,
  });
  if (!result.ok) return { ok: false, reason: result.reason };

  try {
    const parsed = JSON.parse(result.content) as Partial<GenerateLeadSummaryOutput>;
    if (!parsed.shortSummary) return { ok: false, reason: "invalid-response" };
    return {
      ok: true,
      data: {
        shortSummary: parsed.shortSummary,
        patientIntent: parsed.patientIntent ?? "",
        selectedService: parsed.selectedService ?? input.selectedService,
        riskNotes: parsed.riskNotes ?? null,
        suggestedFollowUp: parsed.suggestedFollowUp ?? null,
        leadPriority: parsed.leadPriority ?? "low",
      },
    };
  } catch (error) {
    console.error("[dev-openai-fallback] summary parse failed", error);
    return { ok: false, reason: "invalid-response" };
  }
}
