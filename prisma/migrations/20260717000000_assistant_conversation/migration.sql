-- CreateEnum
CREATE TYPE "AssistantMessageRole" AS ENUM ('user', 'assistant', 'system');

-- AlterTable
ALTER TABLE "AssistantSession" ADD COLUMN     "bookingRequestId" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "questionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "questionLimit" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "serviceSlug" TEXT;

-- CreateTable
CREATE TABLE "AssistantMessage" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "AssistantMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistantMessage_clinicId_idx" ON "AssistantMessage"("clinicId");

-- CreateIndex
CREATE INDEX "AssistantMessage_sessionId_idx" ON "AssistantMessage"("sessionId");

-- CreateIndex
CREATE INDEX "AssistantSession_leadId_idx" ON "AssistantSession"("leadId");

-- CreateIndex
CREATE INDEX "AssistantSession_bookingRequestId_idx" ON "AssistantSession"("bookingRequestId");

-- AddForeignKey
ALTER TABLE "AssistantSession" ADD CONSTRAINT "AssistantSession_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantSession" ADD CONSTRAINT "AssistantSession_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssistantSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

