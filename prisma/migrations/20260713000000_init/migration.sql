-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'needs_consultation', 'needs_doctor_review', 'high_intent', 'follow_up_required');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('assistant', 'header', 'homepage', 'floating');

-- CreateEnum
CREATE TYPE "PreferredContactMethod" AS ENUM ('phone', 'whatsapp', 'instagram');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('requested', 'pending_payment', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentCurrency" AS ENUM ('IRR', 'USDT');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('consultation_fee', 'deposit', 'full_payment');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "SmsEventType" AS ENUM ('appointment_requested', 'appointment_confirmed', 'payment_pending', 'payment_success', 'reminder_24h', 'location_sent');

-- CreateEnum
CREATE TYPE "SmsEventStatus" AS ENUM ('queued', 'sent', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "city" TEXT,
    "ageRange" TEXT,
    "selectedService" TEXT,
    "preferredContactMethod" "PreferredContactMethod",
    "notes" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "source" "LeadSource" NOT NULL DEFAULT 'assistant',
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageAnswer" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriageAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "preferredDate" TEXT,
    "preferredTimeRange" TEXT,
    "selectedSlotId" TEXT,
    "appointmentStatus" "AppointmentStatus" NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentDraft" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "amount" INTEGER,
    "currency" "PaymentCurrency" NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentProvider" TEXT NOT NULL DEFAULT 'placeholder',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsEvent" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "leadId" TEXT,
    "bookingRequestId" TEXT,
    "eventType" "SmsEventType" NOT NULL,
    "status" "SmsEventStatus" NOT NULL DEFAULT 'queued',
    "payloadJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_clinicId_idx" ON "Lead"("clinicId");

-- CreateIndex
CREATE INDEX "Lead_clinicId_mobile_idx" ON "Lead"("clinicId", "mobile");

-- CreateIndex
CREATE INDEX "Lead_clinicId_status_idx" ON "Lead"("clinicId", "status");

-- CreateIndex
CREATE INDEX "TriageAnswer_clinicId_idx" ON "TriageAnswer"("clinicId");

-- CreateIndex
CREATE INDEX "TriageAnswer_leadId_idx" ON "TriageAnswer"("leadId");

-- CreateIndex
CREATE INDEX "BookingRequest_clinicId_idx" ON "BookingRequest"("clinicId");

-- CreateIndex
CREATE INDEX "BookingRequest_leadId_idx" ON "BookingRequest"("leadId");

-- CreateIndex
CREATE INDEX "BookingRequest_clinicId_appointmentStatus_idx" ON "BookingRequest"("clinicId", "appointmentStatus");

-- CreateIndex
CREATE INDEX "PaymentDraft_clinicId_idx" ON "PaymentDraft"("clinicId");

-- CreateIndex
CREATE INDEX "PaymentDraft_leadId_idx" ON "PaymentDraft"("leadId");

-- CreateIndex
CREATE INDEX "SmsEvent_clinicId_idx" ON "SmsEvent"("clinicId");

-- CreateIndex
CREATE INDEX "SmsEvent_leadId_idx" ON "SmsEvent"("leadId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageAnswer" ADD CONSTRAINT "TriageAnswer_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageAnswer" ADD CONSTRAINT "TriageAnswer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDraft" ADD CONSTRAINT "PaymentDraft_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDraft" ADD CONSTRAINT "PaymentDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDraft" ADD CONSTRAINT "PaymentDraft_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsEvent" ADD CONSTRAINT "SmsEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsEvent" ADD CONSTRAINT "SmsEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsEvent" ADD CONSTRAINT "SmsEvent_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

