/**
 * Internal AI Gateway verification — run before staging/doctor review to
 * confirm `INTERNAL_AI_GATEWAY_URL`/`INTERNAL_AI_GATEWAY_TOKEN` actually
 * reach a working gateway, using the exact same `callAiGateway` function
 * the real app calls (not a reimplementation — a pass here means the
 * real code path works).
 *
 * Sends exactly ONE minimal, synthetic `classify_assistant_message`
 * request — a generic script-authored test string, never real patient
 * data (there is no patient in this script). `sessionVerified: true` is
 * passed explicitly here because this is authorized ops/deploy tooling,
 * not a patient-facing flow — the real app's own three independent
 * verification checks (see AI_USAGE_NOTES.md §6) are a separate,
 * unrelated safeguard that still fully applies to every actual patient
 * request.
 *
 * Never prints `INTERNAL_AI_GATEWAY_TOKEN` or any other secret — only
 * connectivity/response-shape status and the test call's own (non-
 * sensitive, synthetic) output.
 *
 *   npm run verify:ai-gateway
 */
import { isGatewayConfigured } from "../src/modules/smart-clinic-assistant/ai/config";
import { callAiGateway } from "../src/modules/smart-clinic-assistant/ai/ai-gateway-client";

const TEST_INPUT = {
  locale: "en",
  currentStep: "general",
  selectedService: null,
  userMessage: "This is an automated connectivity test from verify-ai-gateway.ts — not a real patient message.",
  verified: true as const,
};

async function main() {
  if (!isGatewayConfigured()) {
    console.error(
      "[verify-ai-gateway] FAILED: INTERNAL_AI_GATEWAY_URL and/or INTERNAL_AI_GATEWAY_TOKEN are not set. AI features will degrade gracefully in the app (never crash), but are not live."
    );
    process.exit(1);
  }

  console.log("[verify-ai-gateway] Gateway configured — sending one minimal synthetic test request...");

  const result = await callAiGateway("classify_assistant_message", TEST_INPUT, { sessionVerified: true });

  if (!result.ok) {
    console.error(`[verify-ai-gateway] FAILED: gateway call did not succeed. reason="${result.reason}"`);
    process.exit(1);
  }

  console.log("[verify-ai-gateway] OK — gateway reachable, authenticated, and returned a valid response shape.");
  console.log(
    JSON.stringify(
      {
        status: "ok",
        intent: result.data.intent,
        confidence: result.data.confidence,
        shouldAskFollowup: result.data.shouldAskFollowup,
        safetyFlag: result.data.safetyFlag,
      },
      null,
      2
    )
  );
  process.exit(0);
}

void main();
