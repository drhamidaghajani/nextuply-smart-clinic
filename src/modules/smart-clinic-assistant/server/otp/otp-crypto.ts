import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Node's built-in `crypto` only — no bcrypt/argon2 dependency added (see
 * docs/adr/0007's reasoning: a 6-digit, 5-minute, attempt-limited OTP
 * code doesn't need a slow KDF's offline-brute-force resistance the way
 * a login password does; `scrypt` is already in the standard library and
 * is more than sufficient here).
 */

const SCRYPT_KEY_LENGTH = 32;

export function generateOtpCode(): string {
  // 6-digit numeric code, zero-padded — `randomInt` is cryptographically
  // secure (unlike `Math.random`), appropriate for a value gating access.
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** `salt:hash` — the salt travels with the hash, standard practice, not a secret itself. */
export function hashOtpCode(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyOtpCode(code: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(code, salt, SCRYPT_KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  // Constant-time compare — avoids leaking how many leading bytes matched via response timing.
  return timingSafeEqual(candidate, expected);
}
