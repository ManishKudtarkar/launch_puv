-- CreateTable
CREATE TABLE "EventAgenda" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventAgenda_eventId_idx" ON "EventAgenda"("eventId");

-- CreateIndex
CREATE INDEX "EventAgenda_eventId_displayOrder_idx" ON "EventAgenda"("eventId", "displayOrder");

-- AddForeignKey
ALTER TABLE "EventAgenda" ADD CONSTRAINT "EventAgenda_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
