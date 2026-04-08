-- CreateEnum
CREATE TYPE "public"."ErrorLogStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."ErrorLog" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "source" VARCHAR(200),
    "userAgent" VARCHAR(512),
    "status" "public"."ErrorLogStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "resolvedByAdminId" TEXT,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorLog_userId_createdAt_idx" ON "public"."ErrorLog"("userId", "createdAt");
CREATE INDEX "ErrorLog_status_createdAt_idx" ON "public"."ErrorLog"("status", "createdAt");
CREATE INDEX "ErrorLog_resolvedByAdminId_idx" ON "public"."ErrorLog"("resolvedByAdminId");

-- AddForeignKey
ALTER TABLE "public"."ErrorLog" ADD CONSTRAINT "ErrorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ErrorLog" ADD CONSTRAINT "ErrorLog_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
