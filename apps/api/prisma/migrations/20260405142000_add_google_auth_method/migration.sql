-- AlterEnum
ALTER TYPE "public"."AuthType" ADD VALUE 'GOOGLE';

-- AlterTable
ALTER TABLE "public"."AuthMethod"
ADD COLUMN "google_sub" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AuthMethod_google_sub_key" ON "public"."AuthMethod"("google_sub");
