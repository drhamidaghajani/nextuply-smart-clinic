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

export type RecentUrgentHandoff = {
  id: string;
  content: string;
  createdAt: Date;
  fullName: string | null;
  mobile: string | null;
  serviceSlug: string | null;
  leadId: string | null;
};

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
 *
 * Round 2026-07-25 (Internal Operations Lite polish, Part D — bug:
 * urgent cards showed "بیمار ناشناس" even when the patient had already
 * given their name/mobile): the urgent router logs BEFORE
 * `askAssistantQuestion` ever runs (it's a deterministic client-side
 * short-circuit, see `assistant-drawer.tsx`'s urgency handler), so
 * `AssistantSession.fullName` — normally filled in by
 * `updateAssistantSessionProfile` inside THAT call — was never getting
 * written for an urgent-first message even though `log-handoff.ts` now
 * ALSO writes it directly when known (see that file). This is the
 * read-side half of the fix: a 3-step fallback chain
 * (`session.fullName` → linked `Lead.fullName` → the booking's lead's
 * `fullName`) so a name shows whenever ANY of those three actually has
 * one, not just the session row in isolation. `mobile` uses the same
 * chain, though `session.mobile` is a required field and essentially
 * always present already.
 *
 * Round 2026-07-25, same round (Part E — "no duplicated noisy items"):
 * the urgent router can log up to twice per real episode (once at
 * detection, again if the patient completes OTP afterward and clicks
 * "درخواست تماس فوری کلینیک") — deduped here by (resolved mobile + day),
 * keeping only the latest entry per group, since there's no shared
 * event/session id to group by across those two log points.
 */
export async function listRecentUrgentHandoffs(limit = 5): Promise<RecentUrgentHandoff[]> {
  const clinicId = getDefaultClinicId();
  const rows = await prisma.assistantMessage.findMany({
    where: { clinicId, role: "system", content: { contains: "فوری" } },
    orderBy: { createdAt: "desc" },
    take: limit * 4, // over-fetch before deduping — a single episode can produce up to 2 raw rows, plus room for distinct episodes on the same day.
    include: {
      session: {
        select: {
          fullName: true,
          mobile: true,
          serviceSlug: true,
          leadId: true,
          lead: { select: { fullName: true, mobile: true } },
          bookingRequest: { select: { leadId: true, lead: { select: { fullName: true, mobile: true } } } },
        },
      },
    },
  });

  const resolved = rows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    fullName: row.session.fullName || row.session.lead?.fullName || row.session.bookingRequest?.lead?.fullName || null,
    mobile: row.session.mobile || row.session.lead?.mobile || row.session.bookingRequest?.lead?.mobile || null,
    serviceSlug: row.session.serviceSlug,
    leadId: row.session.leadId || row.session.bookingRequest?.leadId || null,
  }));

  const latestPerGroup = new Map<string, RecentUrgentHandoff>();
  for (const entry of resolved) {
    const dayKey = entry.createdAt.toISOString().slice(0, 10);
    const groupKey = `${entry.mobile ?? entry.id}::${dayKey}`;
    const existing = latestPerGroup.get(groupKey);
    if (!existing || entry.createdAt > existing.createdAt) {
      latestPerGroup.set(groupKey, entry);
    }
  }

  return Array.from(latestPerGroup.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
