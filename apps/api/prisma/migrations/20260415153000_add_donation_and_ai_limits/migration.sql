-- CreateEnum
CREATE TYPE "public"."DonationStatus" AS ENUM ('NONE', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."DonationPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'CANCELED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN "aiAnalysisUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "aiAnalysisLimit" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN "donationStatus" "public"."DonationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "donationGrantedAt" TIMESTAMP(3),
ADD COLUMN "donationExpiresAt" TIMESTAMP(3),
ADD COLUMN "stripeCustomerId" VARCHAR(255);

-- CreateTable
CREATE TABLE "public"."DonationPayment" (
    "id" TEXT NOT NULL,
    "amount" INTEGER,
    "currency" VARCHAR(16),
    "status" "public"."DonationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" VARCHAR(255) NOT NULL,
    "stripePaymentIntentId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "DonationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "public"."User"("stripeCustomerId");
CREATE UNIQUE INDEX "DonationPayment_stripeCheckoutSessionId_key" ON "public"."DonationPayment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "DonationPayment_stripePaymentIntentId_key" ON "public"."DonationPayment"("stripePaymentIntentId");
CREATE INDEX "DonationPayment_userId_createdAt_idx" ON "public"."DonationPayment"("userId", "createdAt");
CREATE INDEX "DonationPayment_status_createdAt_idx" ON "public"."DonationPayment"("status", "createdAt");
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "public"."StripeWebhookEvent"("stripeEventId");

-- AddForeignKey
ALTER TABLE "public"."DonationPayment" ADD CONSTRAINT "DonationPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
