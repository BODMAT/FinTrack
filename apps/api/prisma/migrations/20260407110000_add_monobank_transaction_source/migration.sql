-- CreateEnum
CREATE TYPE "public"."TransactionSource" AS ENUM ('MANUAL', 'MONOBANK');

-- AlterTable
ALTER TABLE "public"."Transaction"
ADD COLUMN "source" "public"."TransactionSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "sourceTransactionId" TEXT,
ADD COLUMN "sourceAccountId" TEXT,
ADD COLUMN "importedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Transaction_userId_source_idx" ON "public"."Transaction"("userId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_source_sourceAccountId_sourceTransactionId_key"
ON "public"."Transaction"("userId", "source", "sourceAccountId", "sourceTransactionId");
