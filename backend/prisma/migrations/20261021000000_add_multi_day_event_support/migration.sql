-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "totalDays" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "isMultiDay" BOOLEAN NOT NULL DEFAULT false;

-- Preserve the existing event date for events created before multi-day support.
UPDATE "Event"
SET "startDate" = "eventDate",
    "endDate" = "eventDate"
WHERE "startDate" IS NULL OR "endDate" IS NULL;

-- AlterTable
ALTER TABLE "Event"
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;

-- CreateTable
CREATE TABLE "EventDay" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "isAttendanceActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDayAttendance" (
    "id" TEXT NOT NULL,
    "eventDayId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventDayAttendance_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "EventAgenda"
ADD COLUMN "eventDayId" TEXT;

-- CreateIndex
CREATE INDEX "EventDay_eventId_idx" ON "EventDay"("eventId");

-- CreateIndex
CREATE INDEX "EventDay_eventId_dayNumber_idx" ON "EventDay"("eventId", "dayNumber");

-- CreateIndex
CREATE INDEX "EventDayAttendance_eventDayId_idx" ON "EventDayAttendance"("eventDayId");

-- CreateIndex
CREATE INDEX "EventDayAttendance_registrationId_idx" ON "EventDayAttendance"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "EventDayAttendance_eventDayId_registrationId_key"
    ON "EventDayAttendance"("eventDayId", "registrationId");

-- CreateIndex
CREATE INDEX "EventAgenda_eventDayId_idx" ON "EventAgenda"("eventDayId");

-- AddForeignKey
ALTER TABLE "EventDay"
ADD CONSTRAINT "EventDay_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDayAttendance"
ADD CONSTRAINT "EventDayAttendance_eventDayId_fkey"
FOREIGN KEY ("eventDayId") REFERENCES "EventDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDayAttendance"
ADD CONSTRAINT "EventDayAttendance_registrationId_fkey"
FOREIGN KEY ("registrationId") REFERENCES "StudentRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAgenda"
ADD CONSTRAINT "EventAgenda_eventDayId_fkey"
FOREIGN KEY ("eventDayId") REFERENCES "EventDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
