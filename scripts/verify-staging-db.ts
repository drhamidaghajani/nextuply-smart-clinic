/**
 * Staging DB round-trip verification — run manually against a real
 * staging `DATABASE_URL` before sign-off (see docs/deployment.md §5).
 *
 * What it does: connects via Prisma, creates ONE clearly-marked
 * synthetic test record chain (Lead → TriageAnswer → BookingRequest →
 * PaymentDraft → SmsEvent — the exact same shape
 * `submitBookingRequest`/`lead-repository.ts` write for a real patient
 * submission), reads it back through the relations to confirm the
 * schema/migrations actually work end-to-end, and prints a short
 * ok/failed summary.
 *
 * Deliberately does NOT:
 * - import the app's cached Prisma singleton (`src/infrastructure/db/
 *   client.ts` is a Next.js dev-hot-reload-safe singleton; this is a
 *   one-shot standalone script, a plain `new PrismaClient()` is correct
 *   here and avoids pulling Next.js module resolution into a bare
 *   `tsx` run)
 * - import `getDefaultClinicId()` from `@/core/tenancy/clinic` for the
 *   same reason (path-alias resolution outside the Next.js build) — the
 *   one-line fallback is duplicated here intentionally, not drifted
 * - mark the booking `appointmentStatus` as anything but the default
 *   `"requested"`, or the payment `paymentStatus` as anything but
 *   `"pending"` — this script proves persistence works, it does not
 *   simulate a confirmed appointment or a successful payment
 * - delete or wipe ANY data, including its own test record — the
 *   created ids are marked (`STAGING_TEST` prefix / dedicated notes
 *   string) so they're easy to find and remove manually later if wanted
 * - print the synthetic test record's own `mobile`/`fullName`/`notes`
 *   values, even though they're script-generated placeholders, not a
 *   real patient's data — only ids, counts, and status are printed, so
 *   this script's output is safe to paste into a deploy chat/ticket
 *   without a second look
 */
import { PrismaClient } from "@prisma/client";

const STAGING_MARKER = "STAGING_VERIFICATION_SCRIPT";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[verify-staging-db] FAILED: DATABASE_URL is not set. Export a real staging Postgres connection string and re-run.");
    process.exit(1);
  }

  const clinicId = process.env.DEFAULT_CLINIC_ID ?? "dr-sadighi-clinic";
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log("[verify-staging-db] Connected to database.");

    await prisma.clinic.upsert({
      where: { id: clinicId },
      update: {},
      create: { id: clinicId, name: "دکتر علیرضا صدیقی" },
    });

    const lead = await prisma.lead.create({
      data: {
        clinicId,
        fullName: STAGING_MARKER,
        mobile: "0000000000",
        selectedService: "rhinoplasty",
        notes: STAGING_MARKER,
        locale: "fa",
        source: "assistant",
        status: "new",
      },
    });

    await prisma.triageAnswer.create({
      data: {
        clinicId,
        leadId: lead.id,
        service: "rhinoplasty",
        questionId: `${STAGING_MARKER}_q1`,
        questionText: STAGING_MARKER,
        answer: STAGING_MARKER,
      },
    });

    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        clinicId,
        leadId: lead.id,
        preferredDate: null,
        preferredTimeRange: null,
        selectedSlotId: null,
        appointmentStatus: "requested", // never anything else — see doc-comment above
      },
    });

    const paymentDraft = await prisma.paymentDraft.create({
      data: {
        clinicId,
        leadId: lead.id,
        bookingRequestId: bookingRequest.id,
        amount: null,
        currency: "IRR",
        paymentType: "consultation_fee",
        paymentStatus: "pending", // never anything else — see doc-comment above
        paymentProvider: "placeholder",
      },
    });

    const smsEvent = await prisma.smsEvent.create({
      data: {
        clinicId,
        leadId: lead.id,
        bookingRequestId: bookingRequest.id,
        eventType: "appointment_requested",
        status: "skipped", // matches real behavior — no SMS provider integrated yet
        payloadJson: JSON.stringify({ marker: STAGING_MARKER }),
      },
    });

    // Read back through the relations — proves the schema/migrations
    // work end-to-end, not just that individual inserts succeeded.
    const readBack = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
      include: { triageAnswers: true, bookingRequests: true, paymentDrafts: true, smsEvents: true },
    });

    const summary = {
      status: "ok" as const,
      clinicId,
      leadId: lead.id,
      triageAnswerCount: readBack.triageAnswers.length,
      bookingRequestId: bookingRequest.id,
      paymentDraftId: paymentDraft.id,
      smsEventId: smsEvent.id,
      readBackCounts: {
        triageAnswers: readBack.triageAnswers.length,
        bookingRequests: readBack.bookingRequests.length,
        paymentDrafts: readBack.paymentDrafts.length,
        smsEvents: readBack.smsEvents.length,
      },
      note: "Test record intentionally left in the database (never auto-deleted) — identifiable by the 'STAGING_VERIFICATION_SCRIPT' marker in fullName/notes. Safe to leave or remove manually.",
    };

    console.log("[verify-staging-db] OK — full persistence chain round-tripped successfully.");
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("[verify-staging-db] FAILED:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
