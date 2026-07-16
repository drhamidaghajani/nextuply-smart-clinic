import { prisma } from "@/infrastructure/db/client";
import { getDefaultClinicId } from "@/core/tenancy/clinic";

/**
 * Explicit, clinicId-scoped persistence functions for OTP verification —
 * same pattern as `../lead-repository.ts` (see that file's doc-comment
 * for why this is hand-written per-function rather than a generic
 * Prisma Client Extension).
 */

const MAX_OTP_ATTEMPTS = 5;
const OTP_TTL_MINUTES = 5;

async function ensureClinicExists(clinicId: string): Promise<void> {
  await prisma.clinic.upsert({
    where: { id: clinicId },
    update: {},
    create: { id: clinicId, name: "دکتر علیرضا صدیقی" },
  });
}

export async function createOtpCode({
  mobile,
  codeHash,
  purpose,
}: {
  mobile: string;
  codeHash: string;
  purpose: "assistant_access" | "booking_request";
}) {
  const clinicId = getDefaultClinicId();
  await ensureClinicExists(clinicId);

  return prisma.otpCode.create({
    data: {
      clinicId,
      mobile,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
}

/** Most recent, unconsumed, unexpired OTP for this mobile+purpose — the only one `verifyOtp` should ever check against. */
export async function findActiveOtpCode(mobile: string, purpose: "assistant_access" | "booking_request") {
  const clinicId = getDefaultClinicId();
  return prisma.otpCode.findFirst({
    where: { clinicId, mobile, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function incrementOtpAttempts(id: string) {
  return prisma.otpCode.update({ where: { id }, data: { attempts: { increment: 1 } } });
}

export async function consumeOtpCode(id: string) {
  return prisma.otpCode.update({ where: { id }, data: { consumedAt: new Date() } });
}

export { MAX_OTP_ATTEMPTS };

export async function createAssistantSession({ mobile, locale }: { mobile: string; locale: string }) {
  const clinicId = getDefaultClinicId();
  return prisma.assistantSession.create({
    data: { clinicId, mobile, locale, verifiedAt: new Date() },
  });
}

export async function findAssistantSession(sessionId: string) {
  const clinicId = getDefaultClinicId();
  return prisma.assistantSession.findFirst({ where: { id: sessionId, clinicId } });
}

/**
 * Round 2026-07-17 (Smart Assistant product redesign): a dev-bypass OTP
 * token (`dev-bypass:<mobile>:<timestamp>` — see `session-guard.ts`, only
 * ever issued/accepted outside production) has no real `AssistantSession`
 * row, since `verifyOtp`'s dev-bypass path deliberately never touches the
 * database. The AI conversation feature needs a real row to enforce the
 * 3-question limit and store the transcript, so when a database IS
 * configured (SMS just isn't) this lazily backs the token with one,
 * keyed by a deterministic id derived from the token itself — same
 * dev-bypass token always resolves to the same row, giving it one
 * consistent 3-question budget for that one verification event, exactly
 * like a real session would have. Never reachable in production (the
 * caller only takes this path for tokens `isDevBypassToken` already
 * confirmed, which is itself structurally production-blocked).
 */
export async function findOrCreateDevBypassAssistantSession({ token, mobile, locale }: { token: string; mobile: string; locale: string }) {
  const clinicId = getDefaultClinicId();
  await ensureClinicExists(clinicId);
  const id = `dev-bypass-session:${token}`;
  return prisma.assistantSession.upsert({
    where: { id },
    update: {},
    create: { id, clinicId, mobile, locale, verifiedAt: new Date() },
  });
}

/**
 * Round 2026-07-17 (Smart Assistant product redesign): fills in
 * `fullName`/`serviceSlug` the first time either becomes known — never
 * overwrites an already-set value, so a later call with a different
 * `serviceSlug` (e.g. the user changes their mind mid-conversation) is a
 * deliberate no-op here; the session's profile reflects how the
 * conversation started, not its latest state.
 */
export async function updateAssistantSessionProfile({
  sessionId,
  fullName,
  serviceSlug,
}: {
  sessionId: string;
  fullName?: string | null;
  serviceSlug?: string | null;
}) {
  const clinicId = getDefaultClinicId();
  const data: { fullName?: string; serviceSlug?: string } = {};
  if (fullName) data.fullName = fullName;
  if (serviceSlug) data.serviceSlug = serviceSlug;
  if (Object.keys(data).length === 0) return;
  await prisma.assistantSession.updateMany({ where: { id: sessionId, clinicId }, data });
}

/**
 * The one place `questionCount` moves — always by exactly 1, always after
 * a real AI answer/unclear result was actually produced (never for a
 * transport failure, which shouldn't cost the patient one of their 3
 * questions). Plain `update` (not clinicId-scoped `updateMany`) is safe
 * here — `sessionId` only ever reaches this function via
 * `findAssistantSession` above, which already clinicId-scoped the lookup
 * that produced it.
 */
export async function incrementAssistantSessionQuestionCount(sessionId: string) {
  return prisma.assistantSession.update({
    where: { id: sessionId },
    data: { questionCount: { increment: 1 } },
  });
}

/**
 * Best-effort link from a verified conversation session to the real
 * booking it led to — called once, from `submit-booking-request.ts`,
 * using the exact `sessionToken` already verified for that submission
 * (not a fuzzy mobile-number match). A session that never leads to a
 * booking simply keeps `leadId`/`bookingRequestId` both `null` — that's
 * an expected, common outcome (asking a question is not a commitment to
 * book), not an error.
 */
export async function linkAssistantSessionToBooking({
  sessionId,
  leadId,
  bookingRequestId,
}: {
  sessionId: string;
  leadId: string;
  bookingRequestId: string;
}) {
  const clinicId = getDefaultClinicId();
  await prisma.assistantSession.updateMany({
    where: { id: sessionId, clinicId },
    data: { leadId, bookingRequestId },
  });
}
