CREATE TABLE "DealPayment" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "farmerId" TEXT NOT NULL,
  "buyerUpiId" TEXT NOT NULL,
  "farmerUpiId" TEXT NOT NULL,
  "platformUpiId" TEXT NOT NULL,
  "produceAmount" DECIMAL(12,2) NOT NULL,
  "platformFee" DECIMAL(10,2) NOT NULL,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECORDED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DealPayment_dealId_key" ON "DealPayment"("dealId");
CREATE INDEX "DealPayment_buyerId_createdAt_idx" ON "DealPayment"("buyerId", "createdAt" DESC);
CREATE INDEX "DealPayment_farmerId_createdAt_idx" ON "DealPayment"("farmerId", "createdAt" DESC);
ALTER TABLE "DealPayment" ADD CONSTRAINT "DealPayment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealPayment" ADD CONSTRAINT "DealPayment_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealPayment" ADD CONSTRAINT "DealPayment_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
