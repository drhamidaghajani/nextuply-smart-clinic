/**
 * The single source of truth for the internal-admin session cookie's
 * name/lifetime — imported by both `src/middleware.ts` (which reads it,
 * Edge runtime) and `server/admin-actions.ts`'s login/logout actions
 * (which set/clear it, Node runtime). Kept in its own tiny module rather
 * than importing one from the other, specifically so nothing in the
 * Node-runtime Server Actions ever pulls `middleware.ts`'s own
 * `next/server` (`NextRequest`/`NextResponse`) Edge-oriented imports
 * into a different bundling context.
 */
export const INTERNAL_ADMIN_COOKIE = "internal_admin_token";
export const INTERNAL_ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h — a short-lived staging session, not a persistent login.

/**
 * Round 2026-07-24 (Internal Operations Lite, Part B) — the SEPARATE
 * cookie for a real `InternalUser` (OWNER/SECRETARY) login, holding an
 * opaque `InternalUserSession.id` (never a token value that itself proves
 * anything — it's just a lookup key, verified server-side on every page
 * load via `internal-auth.ts`'s `requireInternalActor`). Kept as ITS OWN
 * cookie, not reusing `INTERNAL_ADMIN_COOKIE`, so the two auth paths
 * (emergency bootstrap token vs. real per-person account) can coexist and
 * be told apart/cleared independently — logging out of one must never
 * silently also drop the other. Same name exported here (not duplicated
 * in `middleware.ts`/`internal-auth.ts`) for the identical reason the
 * admin cookie name lives here: one Edge-safe module both the middleware
 * (Edge runtime) and the Node-runtime session helpers import.
 */
export const INTERNAL_USER_SESSION_COOKIE = "internal_user_session";
export const INTERNAL_USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days — a real staff login, not a short staging session.
