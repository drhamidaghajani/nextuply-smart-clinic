"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { INTERNAL_USER_SESSION_COOKIE, INTERNAL_USER_SESSION_MAX_AGE_SECONDS } from "@/core/internal-auth-cookie";
import { isPasswordLongEnough } from "@/core/password-crypto";

import { getCurrentInternalActor, requireOwnerActor } from "./internal-auth";
import {
  changeOwnPassword,
  createInternalUser,
  hasAnyOwner,
  setInternalUserActive,
  setInternalUserPassword,
  touchLastLogin,
  verifyInternalUserCredentials,
  createInternalUserSession,
} from "./internal-user-repository";

/**
 * Round 2026-07-24 (Internal Operations Lite, Part B) — every write path
 * for the new `InternalUser` system. Distinct from `smart-clinic-
 * assistant/server/admin-actions.ts` (booking/availability writes, and
 * the emergency bootstrap-token login/logout) by module boundary: this
 * file owns staff IDENTITY, that one owns clinic OPERATIONS data — both
 * sit behind the same `/internal/*` route guard, but they're different
 * concerns.
 */

function setSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>, sessionId: string): void {
  cookieStore.set(INTERNAL_USER_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: INTERNAL_USER_SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Username/password login — the PRIMARY path once at least one OWNER
 * exists (per Hamid: "After OWNER exists, normal username/password login
 * should be primary"). Never reveals whether a username exists at all —
 * a wrong username and a wrong password both redirect to the exact same
 * `?error=1`.
 */
export async function submitInternalUserLoginAction(locale: string, formData: FormData): Promise<void> {
  if (!isDatabaseConfigured()) {
    redirect(`/${locale}/internal/login?error=1`);
  }

  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    redirect(`/${locale}/internal/login?error=1`);
  }

  const user = await verifyInternalUserCredentials(username, password);
  if (!user) {
    redirect(`/${locale}/internal/login?error=1`);
  }

  const session = await createInternalUserSession(user.id);
  await touchLastLogin(user.id);

  const cookieStore = await cookies();
  setSessionCookie(cookieStore, session.id);

  redirect(`/${locale}/internal/dashboard`);
}

/**
 * "Provide a safe way for the token-auth owner to create the first OWNER
 * user" — reachable ONLY while authenticated (bootstrap token or an
 * existing user session) AND only while `hasAnyOwner()` is still false.
 * Once a first OWNER exists, this action refuses — creating additional
 * OWNER accounts isn't a repeatable feature this "lite" pass exposes (per
 * Hamid's brief, only SECRETARY creation is ongoing — see
 * `createSecretaryAction`); a second real owner account is a deliberate,
 * rare action better done directly in the database than a self-service
 * button.
 */
export async function createFirstOwnerAction(locale: string, formData: FormData): Promise<void> {
  const actor = await getCurrentInternalActor();
  if (!actor) redirect(`/${locale}/internal/login`);
  if (!isDatabaseConfigured()) redirect(`/${locale}/internal/users?error=db_unavailable`);
  if (await hasAnyOwner()) redirect(`/${locale}/internal/users?error=owner_exists`);

  const fullName = formData.get("fullName");
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof fullName !== "string" || typeof username !== "string" || typeof password !== "string" || !fullName.trim() || !username.trim()) {
    redirect(`/${locale}/internal/users?error=invalid`);
  }
  if (!isPasswordLongEnough(password)) {
    redirect(`/${locale}/internal/users?error=password_too_short`);
  }

  try {
    await createInternalUser({ fullName, username, password, role: "OWNER" });
  } catch (error) {
    console.error("[create-first-owner] failed", error);
    redirect(`/${locale}/internal/users?error=username_taken`);
  }

  revalidatePath(`/${locale}/internal/users`);
  redirect(`/${locale}/internal/users?created=1`);
}

/** OWNER-only: create a new SECRETARY account. */
export async function createSecretaryAction(locale: string, formData: FormData): Promise<void> {
  await requireOwnerActor(locale);
  if (!isDatabaseConfigured()) redirect(`/${locale}/internal/users?error=db_unavailable`);

  const fullName = formData.get("fullName");
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof fullName !== "string" || typeof username !== "string" || typeof password !== "string" || !fullName.trim() || !username.trim()) {
    redirect(`/${locale}/internal/users?error=invalid`);
  }
  if (!isPasswordLongEnough(password)) {
    redirect(`/${locale}/internal/users?error=password_too_short`);
  }

  try {
    await createInternalUser({ fullName, username, password, role: "SECRETARY" });
  } catch (error) {
    console.error("[create-secretary] failed", error);
    redirect(`/${locale}/internal/users?error=username_taken`);
  }

  revalidatePath(`/${locale}/internal/users`);
  redirect(`/${locale}/internal/users?created=1`);
}

/** OWNER-only: activate/deactivate a secretary — deactivating also kills their existing sessions (see `setInternalUserActive`'s doc-comment). */
export async function toggleInternalUserActiveAction(locale: string, userId: string, nextActive: boolean): Promise<void> {
  await requireOwnerActor(locale);
  if (!isDatabaseConfigured()) return;
  await setInternalUserActive(userId, nextActive);
  revalidatePath(`/${locale}/internal/users`);
}

/** OWNER-only: set a new password for a secretary account (OWNER chooses/hands them the new password directly — no email-reset flow in this "lite" pass). */
export async function resetInternalUserPasswordAction(locale: string, userId: string, formData: FormData): Promise<void> {
  await requireOwnerActor(locale);
  if (!isDatabaseConfigured()) redirect(`/${locale}/internal/users?error=db_unavailable`);

  const password = formData.get("password");
  if (typeof password !== "string" || !isPasswordLongEnough(password)) {
    redirect(`/${locale}/internal/users?error=password_too_short`);
  }

  await setInternalUserPassword(userId, password);
  revalidatePath(`/${locale}/internal/users`);
  redirect(`/${locale}/internal/users?reset=1`);
}

/** Any logged-in DB user (OWNER or SECRETARY) changing their OWN password — requires the current password, unlike the OWNER-driven reset above. */
export async function changeOwnPasswordAction(locale: string, formData: FormData): Promise<void> {
  const actor = await getCurrentInternalActor();
  if (!actor || actor.kind !== "user") redirect(`/${locale}/internal/login`);
  if (!isDatabaseConfigured()) redirect(`/${locale}/internal/settings?error=db_unavailable`);

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword) {
    redirect(`/${locale}/internal/settings?error=invalid`);
  }
  if (!isPasswordLongEnough(newPassword)) {
    redirect(`/${locale}/internal/settings?error=password_too_short`);
  }

  const result = await changeOwnPassword(actor.user.id, currentPassword, newPassword);
  if (!result.ok) {
    redirect(`/${locale}/internal/settings?error=${result.error}`);
  }

  // Password change invalidates every session for this account (see
  // `setInternalUserPassword`) — including the one making THIS request —
  // so the visitor must log in again with the new password. Clear the
  // now-dead cookie locally rather than leaving a doomed one behind.
  const cookieStore = await cookies();
  cookieStore.delete(INTERNAL_USER_SESSION_COOKIE);
  redirect(`/${locale}/internal/login?passwordChanged=1`);
}
