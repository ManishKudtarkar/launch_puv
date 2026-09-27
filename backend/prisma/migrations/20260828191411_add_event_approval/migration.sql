-- CreateEnum
CREATE TYPE "EventApprovalAction" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "EventApproval" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "EventApprovalAction" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventApproval_eventId_idx" ON "EventApproval"("eventId");

-- CreateIndex
CREATE INDEX "EventApproval_adminId_idx" ON "EventApproval"("adminId");

-- CreateIndex
CREATE INDEX "EventApproval_action_idx" ON "EventApproval"("action");

-- CreateIndex
CREATE INDEX "EventApproval_createdAt_idx" ON "EventApproval"("createdAt");

-- AddForeignKey
ALTER TABLE "EventApproval" ADD CONSTRAINT "EventApproval_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventApproval" ADD CONSTRAINT "EventApproval_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
