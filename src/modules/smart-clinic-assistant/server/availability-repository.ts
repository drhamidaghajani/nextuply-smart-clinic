import { prisma } from "@/infrastructure/db/client";
import { getDefaultClinicId } from "@/core/tenancy/clinic";

/**
 * Explicit, clinicId-scoped persistence functions for
 * `DoctorAvailabilitySlot` — same hand-written-per-function pattern as
 * `lead-repository.ts` (see that file's doc-comment for why). Backs
 * `/internal/availability` (Clinic Operations Lite, round 2026-07-15) —
 * see `prisma/schema.prisma`'s doc-comment on the model itself for the
 * "recurring weekly slot, not a full calendar" scope decision.
 */

async function ensureClinicExists(clinicId: string): Promise<void> {
  await prisma.clinic.upsert({
    where: { id: clinicId },
    update: {},
    create: { id: clinicId, name: "دکتر علیرضا صدیقی" },
  });
}

/** Ordered by weekday then start time so the admin table reads as a real weekly schedule, not an unordered log. */
export async function listDoctorAvailabilitySlots() {
  const clinicId = getDefaultClinicId();
  return prisma.doctorAvailabilitySlot.findMany({
    where: { clinicId },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function createDoctorAvailabilitySlot({
  weekday,
  startTime,
  endTime,
  capacity,
  note,
}: {
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  note: string | null;
}) {
  const clinicId = getDefaultClinicId();
  await ensureClinicExists(clinicId);

  return prisma.doctorAvailabilitySlot.create({
    data: { clinicId, weekday, startTime, endTime, capacity, note, isActive: true },
  });
}

/** clinicId-scoped like every write here — a mismatched id/clinicId updates zero rows rather than leaking a cross-tenant write. */
export async function updateDoctorAvailabilitySlot({
  id,
  capacity,
  note,
  isActive,
}: {
  id: string;
  capacity: number;
  note: string | null;
  isActive: boolean;
}) {
  const clinicId = getDefaultClinicId();
  return prisma.doctorAvailabilitySlot.updateMany({
    where: { id, clinicId },
    data: { capacity, note, isActive },
  });
}

export async function setDoctorAvailabilitySlotActive({ id, isActive }: { id: string; isActive: boolean }) {
  const clinicId = getDefaultClinicId();
  return prisma.doctorAvailabilitySlot.updateMany({
    where: { id, clinicId },
    data: { isActive },
  });
}
