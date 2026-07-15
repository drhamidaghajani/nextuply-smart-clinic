/**
 * Central config for the AI Gateway boundary — the only place these env
 * vars are read. See `ai-gateway-client.ts` for how they're used.
 */

export function getGatewayUrl(): string | undefined {
  return process.env.INTERNAL_AI_GATEWAY_URL || undefined;
}

export function getGatewayToken(): string | undefined {
  return process.env.INTERNAL_AI_GATEWAY_TOKEN || undefined;
}

export function isGatewayConfigured(): boolean {
  return Boolean(getGatewayUrl() && getGatewayToken());
}

/**
 * Direct OpenAI is a LOCAL DEV FALLBACK ONLY — structurally blocked in
 * production regardless of the env flag's value (defense-in-depth: even
 * if `ALLOW_DIRECT_OPENAI_IN_DEV=true` leaked into a production
 * environment by mistake, this still returns `false` there). Default is
 * `false` even in development — must be explicitly opted into.
 */
export function isDirectOpenAiDevAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DIRECT_OPENAI_IN_DEV === "true" && Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}
