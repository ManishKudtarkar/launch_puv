-- AlterTable
ALTER TABLE "User"
ADD COLUMN "ugNumber" TEXT,
ADD COLUMN "enrollmentNumber" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "isVerifiedDomain" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_ugNumber_key" ON "User"("ugNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_enrollmentNumber_key" ON "User"("enrollmentNumber");
