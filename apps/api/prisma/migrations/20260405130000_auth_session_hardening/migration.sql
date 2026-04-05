-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "role" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "public"."Session" (
    "sessionId" TEXT NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "familyId" VARCHAR(64) NOT NULL,
    "parentSessionId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" VARCHAR(512),
    "ip" VARCHAR(64),
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");
CREATE INDEX "Session_familyId_idx" ON "public"."Session"("familyId");
CREATE INDEX "Session_expiresAt_idx" ON "public"."Session"("expiresAt");
CREATE INDEX "Session_revokedAt_idx" ON "public"."Session"("revokedAt");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_parentSessionId_fkey" FOREIGN KEY ("parentSessionId") REFERENCES "public"."Session"("sessionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropTable
DROP TABLE "public"."RefreshToken";
