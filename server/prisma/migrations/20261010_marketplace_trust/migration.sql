ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "FPO" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN "cropGrade" TEXT;
ALTER TABLE "Listing" ADD COLUMN "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_fpoId_fkey" FOREIGN KEY ("fpoId") REFERENCES "FPO"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "DealReview" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DealReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DealReview_dealId_authorId_key" ON "DealReview"("dealId", "authorId");
CREATE INDEX "DealReview_subjectId_createdAt_idx" ON "DealReview"("subjectId", "createdAt" DESC);
ALTER TABLE "DealReview" ADD CONSTRAINT "DealReview_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealReview" ADD CONSTRAINT "DealReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealReview" ADD CONSTRAINT "DealReview_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
