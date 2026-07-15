-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "appointmentDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "BookingRequest_selectedSlotId_appointmentDate_idx" ON "BookingRequest"("selectedSlotId", "appointmentDate");

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_selectedSlotId_fkey" FOREIGN KEY ("selectedSlotId") REFERENCES "DoctorAvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
