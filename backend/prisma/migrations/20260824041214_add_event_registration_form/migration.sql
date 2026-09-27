-- CreateEnum
CREATE TYPE "RegistrationFormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "EventRegistrationForm" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "mandatoryFields" JSONB NOT NULL,
    "selectedFields" JSONB NOT NULL,
    "status" "RegistrationFormStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistrationForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventRegistrationForm_eventId_idx" ON "EventRegistrationForm"("eventId");

-- CreateIndex
CREATE INDEX "EventRegistrationForm_status_idx" ON "EventRegistrationForm"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistrationForm_eventId_version_key" ON "EventRegistrationForm"("eventId", "version");

-- AddForeignKey
ALTER TABLE "EventRegistrationForm" ADD CONSTRAINT "EventRegistrationForm_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
