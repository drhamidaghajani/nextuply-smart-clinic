import { getGatewayToken, getGatewayUrl, isDirectOpenAiDevAllowed, isGatewayConfigured } from "./config";
import { classifyViaDevOpenAi, summarizeViaDevOpenAi } from "./dev-openai-fallback";
import type { GatewayResult, GatewayTask, GatewayTaskMap } from "./types";

/**
 * The ONE entry point for every AI call in this module — see
 * `AI_USAGE_NOTES.md`. No file outside `ai/` (and its own
 * `server/ai/intent-detector.ts` / `server/ai/lead-summary.ts` callers)
 * ever touches OpenAI or the gateway directly. `intent-detector.ts` and
 * `lead-summary.ts` don't know or care which transport actually served
 * their request.
 *
 * Transport priority:
 * 1. Internal AI Gateway, if `INTERNAL_AI_GATEWAY_URL` +
 *    `INTERNAL_AI_GATEWAY_TOKEN` are both set — the only path allowed in
 *    production, and preferred in development too when available (dev
 *    should exercise the real path whenever it can).
 * 2. Direct OpenAI, ONLY when `isDirectOpenAiDevAllowed()` — which is
 *    itself hard-blocked in production regardless of any env value (see
 *    `config.ts`). This repo has no gateway service deployed anywhere
 *    yet (confirmed: SYSTEM_ARCHITECTURE.md §6/§8 describes it as a
 *    separate n8n+gateway service, not code in this app), so this is the
 *    path actually exercised during local development today.
 * 3. Neither configured → `{ ok: false, reason: "not-configured" }`,
 *    never a crash, never a silent production fallback to OpenAI.
 */
const GATEWAY_TIMEOUT_MS = 5000;

export async function callAiGateway<T extends GatewayTask>(
  task: T,
  input: GatewayTaskMap[T]["input"],
  options: { sessionVerified: boolean }
): Promise<GatewayResult<T>> {
  // Round 2026-07-14 (AI Gateway boundary pass): re-checked here, not
  // just trusted from the caller — "before any AI Gateway request,
  // verify AssistantSession server-side... do not call the gateway" is
  // enforced structurally at this one chokepoint, not left to caller
  // discipline. Callers (`intent-detector.ts`, `lead-summary.ts`) still
  // do their own check too (defense-in-depth is cheap; redundancy here
  // costs nothing since this function is only ever called after a real
  // `isSessionVerified` lookup already happened server-side).
  if (!options.sessionVerified) {
    return { ok: false, reason: "not-verified" };
  }

  if (isGatewayConfigured()) {
    return callRealGateway(task, input);
  }

  if (isDirectOpenAiDevAllowed()) {
    return callDevOpenAiFallback(task, input);
  }

  return { ok: false, reason: "not-configured" };
}

async function callRealGateway<T extends GatewayTask>(task: T, input: GatewayTaskMap[T]["input"]): Promise<GatewayResult<T>> {
  const url = getGatewayUrl();
  const token = getGatewayToken();
  if (!url || !token) return { ok: false, reason: "not-configured" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ task, input }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[ai-gateway] non-2xx response", response.status);
      return { ok: false, reason: "http-error" };
    }

    const data = (await response.json()) as { output?: unknown };
    if (!data || typeof data !== "object" || data.output === undefined) {
      return { ok: false, reason: "invalid-response" };
    }
    return { ok: true, data: data.output as GatewayTaskMap[T]["output"] };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("[ai-gateway] request failed", isAbort ? "timeout" : error);
    return { ok: false, reason: isAbort ? "timeout" : "network-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callDevOpenAiFallback<T extends GatewayTask>(task: T, input: GatewayTaskMap[T]["input"]): Promise<GatewayResult<T>> {
  if (task === "classify_assistant_message") {
    return classifyViaDevOpenAi(input as GatewayTaskMap["classify_assistant_message"]["input"]) as Promise<GatewayResult<T>>;
  }
  if (task === "generate_lead_summary") {
    return summarizeViaDevOpenAi(input as GatewayTaskMap["generate_lead_summary"]["input"]) as Promise<GatewayResult<T>>;
  }
  return { ok: false, reason: "not-configured" };
}
