import { prisma } from "@/infrastructure/db/client";
import { getDefaultClinicId } from "@/core/tenancy/clinic";

/**
 * Round 2026-07-17 (Smart Assistant product redesign, per Hamid):
 * persistence for the post-OTP, up-to-3-question AI conversation
 * transcript (`AssistantMessage`, one row per question/answer) — separate
 * from `../otp/otp-repository.ts` (which owns `AssistantSession` itself)
 * since this is conversation-content CRUD, not OTP/session-identity CRUD.
 * Same hand-written, clinicId-scoped pattern as every other repository
 * file in this module — see `../lead-repository.ts`'s doc-comment.
 *
 * `content` is only ever the literal question text a patient typed or the
 * literal answer text shown back to them — never an OTP code, never a
 * secret, never raw AI-gateway/error internals (callers are responsible
 * for only passing user-facing text here).
 */

export async function createAssistantMessage({
  sessionId,
  role,
  content,
}: {
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
}) {
  const clinicId = getDefaultClinicId();
  return prisma.assistantMessage.create({
    data: { clinicId, sessionId, role, content },
  });
}

/** Chronological, for the internal transcript view — clinicId-scoped like every other admin read in this module. */
export async function listAssistantMessagesForSession(sessionId: string) {
  const clinicId = getDefaultClinicId();
  return prisma.assistantMessage.findMany({
    where: { clinicId, sessionId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Round 2026-07-24 (Internal Operations Lite, Part E) — powers the
 * dashboard's "urgent requests" highlight panel. Reuses the EXISTING
 * `role: "system"`, `"handoff: "`-prefixed message log (`log-handoff.ts`)
 * — no new table. Filtered to the URGENT subset specifically (every
 * urgent-router reason string this codebase writes contains "فوری";
 * the other handoff triggers — explicit human request, repeated
 * dissatisfaction, repeated "unclear" — never do), since a secretary
 * scanning the dashboard needs to see safety-relevant requests first,
 * not every handoff reason mixed together.
 */
export async function listRecentUrgentHandoffs(limit = 5) {
  const clinicId = getDefaultClinicId();
  return prisma.assistantMessage.findMany({
    where: { clinicId, role: "system", content: { contains: "فوری" } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { session: { select: { fullName: true, mobile: true, serviceSlug: true } } },
  });
}
