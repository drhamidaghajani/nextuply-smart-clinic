import { isDatabaseConfigured } from "@/infrastructure/db/client";

import { findAssistantSession } from "./otp-repository";

/**
 * `dev-bypass:<mobile>:<timestamp>` — issued only by `verifyOtp` when
 * `NODE_ENV !== "production"` AND no SMS provider is configured (see
 * that file). Structurally cannot be produced or accepted in production:
 * both the issuing AND the checking side hard-require
 * `NODE_ENV !== "production"`. Valid for 6 hours from issuance, matching
 * a plausible single testing session — not indefinitely, so a stale dev
 * token from a previous run doesn't linger.
 */
const DEV_BYPASS_PREFIX = "dev-bypass:";
const DEV_BYPASS_TOKEN_TTL_MS = 1000 * 60 * 60 * 6;

export function issueDevBypassToken(mobile: string): string {
  return `${DEV_BYPASS_PREFIX}${mobile}:${Date.now()}`;
}

export function isDevBypassToken(token: string): boolean {
  return token.startsWith(DEV_BYPASS_PREFIX);
}

function isValidDevBypassToken(token: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const parts = token.slice(DEV_BYPASS_PREFIX.length).split(":");
  const timestamp = Number(parts[parts.length - 1]);
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp < DEV_BYPASS_TOKEN_TTL_MS;
}

/** Round 2026-07-17 (Smart Assistant product redesign): exported so `ask-assistant-question.ts` can validate a dev-bypass token AND recover its mobile, to lazily back it with a real (deterministic-id) `AssistantSession` row when a database IS configured but SMS isn't — see that file's doc-comment. Never used for the actual verification gate itself, which stays exactly as it was. */
export { isValidDevBypassToken };

export function extractDevBypassMobile(token: string): string | null {
  if (!isDevBypassToken(token)) return null;
  const rest = token.slice(DEV_BYPASS_PREFIX.length);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon === -1) return null;
  return rest.slice(0, lastColon);
}

/**
 * The one function every gated Server Action calls before doing anything
 * AI-related or persisting a submission — see docs/adr/0007. Never
 * trusts client-asserted verification; always re-checks server-side.
 */
export async function isSessionVerified(sessionToken: string | null | undefined): Promise<boolean> {
  if (!sessionToken) return false;

  if (sessionToken.startsWith(DEV_BYPASS_PREFIX)) {
    return isValidDevBypassToken(sessionToken);
  }

  if (!isDatabaseConfigured()) return false;

  try {
    const session = await findAssistantSession(sessionToken);
    return Boolean(session);
  } catch (error) {
    console.error("[session-guard] lookup failed", error);
    return false;
  }
}
