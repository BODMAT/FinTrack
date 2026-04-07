-- AlterTable
ALTER TABLE "public"."Transaction"
ADD COLUMN "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'USD';
