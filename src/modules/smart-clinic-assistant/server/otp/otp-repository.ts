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
