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

function isValidDevBypassToken(token: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const parts = token.slice(DEV_BYPASS_PREFIX.length).split(":");
  const timestamp = Number(parts[parts.length - 1]);
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp < DEV_BYPASS_TOKEN_TTL_MS;
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
