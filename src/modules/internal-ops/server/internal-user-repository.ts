import type { InternalUser, InternalUserRole } from "@prisma/client";

import { prisma } from "@/infrastructure/db/client";
import { getDefaultClinicId } from "@/core/tenancy/clinic";
import { INTERNAL_USER_SESSION_MAX_AGE_SECONDS } from "@/core/internal-auth-cookie";
import { hashPassword, verifyPassword } from "@/core/password-crypto";

/**
 * Round 2026-07-24 (Internal Operations Lite, Part B) — explicit,
 * clinicId-scoped persistence functions for `InternalUser`/
 * `InternalUserSession`, matching this codebase's established repository
 * convention (`lead-repository.ts`, `otp-repository.ts`) rather than raw
 * Prisma calls from Server Actions/pages. `passwordHash` is never
 * returned to a caller that doesn't need it — `PublicInternalUser` below
 * is what every list/read function actually returns.
 */

export type PublicInternalUser = {
  id: string;
  fullName: string;
  username: string;
  role: InternalUserRole;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

function toPublicUser(user: InternalUser): PublicInternalUser {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/** Usernames are always compared/stored lowercase — normalized here, the one boundary every caller goes through. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function hasAnyOwner(): Promise<boolean> {
  const count = await prisma.internalUser.count({ where: { role: "OWNER" } });
  return count > 0;
}

export async function listInternalUsers(): Promise<PublicInternalUser[]> {
  const users = await prisma.internalUser.findMany({ orderBy: { createdAt: "asc" } });
  return users.map(toPublicUser);
}

/**
 * The one function that verifies a username/password pair. Returns the
 * matched user only on success — never distinguishes "no such username"
 * from "wrong password" to the caller beyond a `null`, so a login form
 * can't be used to enumerate valid usernames. `isActive: false` accounts
 * (a deactivated secretary) also fail here, not just at the page-gate
 * level, so a stale session can never be created for them in the first
 * place.
 */
export async function verifyInternalUserCredentials(rawUsername: string, password: string): Promise<PublicInternalUser | null> {
  const username = normalizeUsername(rawUsername);
  const user = await prisma.internalUser.findUnique({ where: { username } });
  if (!user || !user.isActive) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return toPublicUser(user);
}

export async function createInternalUser({
  fullName,
  username,
  password,
  role,
}: {
  fullName: string;
  username: string;
  password: string;
  role: InternalUserRole;
}): Promise<PublicInternalUser> {
  const clinicId = getDefaultClinicId();
  await prisma.clinic.upsert({ where: { id: clinicId }, update: {}, create: { id: clinicId, name: "دکتر علیرضا صدیقی" } });

  const user = await prisma.internalUser.create({
    data: {
      clinicId,
      fullName: fullName.trim(),
      username: normalizeUsername(username),
      passwordHash: hashPassword(password),
      role,
    },
  });
  return toPublicUser(user);
}

export async function setInternalUserActive(userId: string, isActive: boolean): Promise<void> {
  await prisma.internalUser.update({ where: { id: userId }, data: { isActive } });
  // Deactivating a secretary must also kill any session they're currently
  // holding — otherwise a stale cookie would keep working until it
  // naturally expires (up to 30 days later). Reactivating does NOT
  // resurrect old sessions; they'd have to log in again, which is correct.
  if (!isActive) {
    await prisma.internalUserSession.deleteMany({ where: { userId } });
  }
}

export async function setInternalUserPassword(userId: string, newPassword: string): Promise<void> {
  await prisma.internalUser.update({ where: { id: userId }, data: { passwordHash: hashPassword(newPassword) } });
  // A password reset/change also invalidates every existing session for
  // this account — if a secretary's password was reset because a device
  // was lost, the old session must not keep working.
  await prisma.internalUserSession.deleteMany({ where: { userId } });
}

/** Used by "change own password" — re-verifies the CURRENT password first, distinct from `resetInternalUserPassword` (OWNER resetting a secretary's password does not need to know the old one). */
export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: "current_password_invalid" | "user_not_found" }> {
  const user = await prisma.internalUser.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "user_not_found" };
  if (!verifyPassword(currentPassword, user.passwordHash)) return { ok: false, error: "current_password_invalid" };
  await setInternalUserPassword(userId, newPassword);
  return { ok: true };
}

export async function touchLastLogin(userId: string): Promise<void> {
  await prisma.internalUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export async function createInternalUserSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + INTERNAL_USER_SESSION_MAX_AGE_SECONDS * 1000);
  const session = await prisma.internalUserSession.create({ data: { userId, expiresAt } });
  return { id: session.id, expiresAt: session.expiresAt };
}

export async function deleteInternalUserSession(sessionId: string): Promise<void> {
  await prisma.internalUserSession.deleteMany({ where: { id: sessionId } });
}

export type ValidInternalUserSession = {
  sessionId: string;
  user: PublicInternalUser;
};

/** `null` for a missing, expired, OR deactivated-user session — the caller (`internal-auth.ts`) never needs to know which. */
export async function findValidInternalUserSession(sessionId: string): Promise<ValidInternalUserSession | null> {
  const session = await prisma.internalUserSession.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.internalUserSession.deleteMany({ where: { id: session.id } });
    return null;
  }
  if (!session.user.isActive) return null;
  return { sessionId: session.id, user: toPublicUser(session.user) };
}
