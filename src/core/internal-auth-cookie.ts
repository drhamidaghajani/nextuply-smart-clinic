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
