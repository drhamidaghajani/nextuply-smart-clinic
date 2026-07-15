/**
 * Single-tenant placeholder — see docs/adr/0004-assistant-persistence-
 * schema.md. No session/staff-auth system exists yet to resolve a real
 * per-request tenant (PROJECT_UNDERSTANDING.md §13's open question), so
 * this returns one fixed clinic id today. Every tenant-owned query in
 * this codebase should go through this function (or a future real
 * session-derived equivalent) rather than hardcoding a clinic id inline
 * — swapping this one function is the entire multi-tenant migration path
 * for reads/writes that already call it.
 */
export function getDefaultClinicId(): string {
  return process.env.DEFAULT_CLINIC_ID ?? "dr-sadighi-clinic";
}
