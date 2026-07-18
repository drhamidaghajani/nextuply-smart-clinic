import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Round 2026-07-24 (Internal Operations Lite, Part B — per Hamid: "Hash
 * password with scrypt or existing secure hashing utility"). Mirrors
 * `server/otp/otp-crypto.ts` exactly (same Node built-in `scrypt`, same
 * `salt:hash` storage format, same constant-time comparison) rather than
 * adding a bcrypt/argon2 dependency — this codebase's existing ADR-0007
 * reasoning for OTP codes applies just as well to a secretary/owner login
 * password: Node's `crypto` is already in the standard library and
 * already proven out here. A longer key length than the OTP hash (64
 * bytes vs. 32) since a password's keyspace is far larger than a 6-digit
 * code and is worth the extra margin.
 */

const SCRYPT_KEY_LENGTH = 64;
export const MIN_PASSWORD_LENGTH = 8;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

/** `salt:hash` — the salt travels with the hash, standard practice, not a secret itself. Never logs or returns the plaintext password. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  // Constant-time compare — avoids leaking how many leading bytes matched via response timing.
  return timingSafeEqual(candidate, expected);
}
