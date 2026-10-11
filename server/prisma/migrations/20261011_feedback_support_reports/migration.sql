ALTER TABLE "DealReview"
  ADD COLUMN "deliveryOnTime" TEXT,
  ADD COLUMN "qualityMatched" TEXT,
  ADD COLUMN "communication" TEXT;

CREATE TABLE "SupportReport" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dealId" TEXT,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportReport_userId_createdAt_idx" ON "SupportReport"("userId", "createdAt" DESC);
CREATE INDEX "SupportReport_status_createdAt_idx" ON "SupportReport"("status", "createdAt");
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
