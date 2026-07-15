-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'contacted';

-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "internalNote" TEXT;

-- CreateTable
CREATE TABLE "DoctorAvailabilitySlot" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorAvailabilitySlot_clinicId_idx" ON "DoctorAvailabilitySlot"("clinicId");

-- CreateIndex
CREATE INDEX "DoctorAvailabilitySlot_clinicId_isActive_idx" ON "DoctorAvailabilitySlot"("clinicId", "isActive");

-- AddForeignKey
ALTER TABLE "DoctorAvailabilitySlot" ADD CONSTRAINT "DoctorAvailabilitySlot_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
