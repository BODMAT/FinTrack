/*
  Warnings:

  - You are about to drop the column `tg_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tg_nickname` on the `User` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AuthType" AS ENUM ('EMAIL', 'TELEGRAM');

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropIndex
DROP INDEX "public"."User_tg_id_key";

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "tg_id",
DROP COLUMN "tg_nickname",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(200);

-- CreateTable
CREATE TABLE "public"."AuthMethod" (
    "id" TEXT NOT NULL,
    "type" "public"."AuthType" NOT NULL,
    "email" VARCHAR(200),
    "password_hash" TEXT,
    "telegram_id" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthMethod_email_key" ON "public"."AuthMethod"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthMethod_telegram_id_key" ON "public"."AuthMethod"("telegram_id");

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuthMethod" ADD CONSTRAINT "AuthMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
