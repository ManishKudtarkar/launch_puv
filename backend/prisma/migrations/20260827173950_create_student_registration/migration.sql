-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "StudentRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formVersion" INTEGER NOT NULL,
    "registrationData" JSONB NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentRegistration_eventId_idx" ON "StudentRegistration"("eventId");

-- CreateIndex
CREATE INDEX "StudentRegistration_userId_idx" ON "StudentRegistration"("userId");

-- CreateIndex
CREATE INDEX "StudentRegistration_status_idx" ON "StudentRegistration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRegistration_eventId_userId_key" ON "StudentRegistration"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "StudentRegistration" ADD CONSTRAINT "StudentRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRegistration" ADD CONSTRAINT "StudentRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
