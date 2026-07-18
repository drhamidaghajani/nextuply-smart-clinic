import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { INTERNAL_ADMIN_COOKIE, INTERNAL_USER_SESSION_COOKIE } from "@/core/internal-auth-cookie";

import { findValidInternalUserSession, type PublicInternalUser } from "./internal-user-repository";

/**
 * Round 2026-07-24 (Internal Operations Lite, Part B) — the ONE place
 * that resolves "who is making this internal-admin request." Two
 * completely independent identities can satisfy it:
 *
 * 1. `"bootstrap"` — the shared `INTERNAL_ADMIN_TOKEN` (per Hamid: "Keep
 *    existing INTERNAL_ADMIN_TOKEN as emergency/bootstrap owner login...
 *    do not remove until DB auth is fully working" — and even after,
 *    kept permanently as "ورود اضطراری مدیرکل"). Always treated as
 *    OWNER-equivalent access — it is, after all, the same token that
 *    already governs `/internal/*` route access at the middleware layer.
 * 2. `"user"` — a real `InternalUser` row, found via the opaque
 *    `InternalUserSession` id stored in `INTERNAL_USER_SESSION_COOKIE`.
 *
 * `src/middleware.ts` (Edge runtime) only checks that ONE of the two
 * cookies is PRESENT before letting a request reach an `/internal/*`
 * page — it cannot query Postgres from Edge without a driver adapter this
 * "lite" pass doesn't add. This function is the REAL check: it runs in
 * the Node runtime every internal page/Server Action already executes
 * in, actually looks up the session, and is what every internal page
 * must call before rendering anything sensitive. A stale/expired/
 * deactivated-user cookie that slipped past the lightweight Edge check
 * simply resolves to `null` here and gets redirected to login — the user
 * never sees a flash of protected content, since this runs server-side
 * before any HTML is sent.
 */
export type InternalActor =
  | { kind: "bootstrap"; role: "OWNER"; label: string }
  | { kind: "user"; sessionId: string; role: "OWNER" | "SECRETARY"; user: PublicInternalUser };

export async function getCurrentInternalActor(): Promise<InternalActor | null> {
  const cookieStore = await cookies();

  const requiredToken = process.env.INTERNAL_ADMIN_TOKEN;
  const bootstrapCookie = cookieStore.get(INTERNAL_ADMIN_COOKIE)?.value;
  if (requiredToken && bootstrapCookie === requiredToken) {
    return { kind: "bootstrap", role: "OWNER", label: "مدیر اضطراری" };
  }

  const sessionId = cookieStore.get(INTERNAL_USER_SESSION_COOKIE)?.value;
  if (sessionId && isDatabaseConfigured()) {
    try {
      const session = await findValidInternalUserSession(sessionId);
      if (session) {
        return { kind: "user", sessionId: session.sessionId, role: session.user.role, user: session.user };
      }
    } catch (error) {
      console.error("[internal-auth] session lookup failed", error);
    }
  }

  return null;
}

/** Every `/internal/*` page (except `/internal/login`) calls this first — redirects to login if not authenticated, same as `src/middleware.ts`'s guard, just re-checked with real DB knowledge. */
export async function requireInternalActor(locale: string): Promise<InternalActor> {
  const actor = await getCurrentInternalActor();
  if (!actor) redirect(`/${locale}/internal/login`);
  return actor;
}

/** OWNER-only pages (`/internal/users`) call this instead — a SECRETARY who somehow reaches the URL is sent to the dashboard, not shown a bare 403 (matches this app's "guide, don't just block" tone elsewhere). */
export async function requireOwnerActor(locale: string): Promise<InternalActor> {
  const actor = await requireInternalActor(locale);
  if (actor.role !== "OWNER") redirect(`/${locale}/internal/dashboard`);
  return actor;
}

/** Display name for the nav/settings page — the bootstrap identity has no real name, so it gets its own fixed label instead of `undefined`. */
export function actorDisplayName(actor: InternalActor): string {
  return actor.kind === "bootstrap" ? actor.label : actor.user.fullName;
}
