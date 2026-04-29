-- Add primary email field to User for cross-method deduplication
ALTER TABLE "User" ADD COLUMN "email" VARCHAR(200);

-- Backfill User.email from existing EMAIL AuthMethod records
UPDATE "User" u
SET "email" = am.email
FROM "AuthMethod" am
WHERE am."userId" = u.id
  AND am.type = 'EMAIL'
  AND am.email IS NOT NULL;

-- Add unique constraint after backfill
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Create EmailVerificationToken table
CREATE TABLE "EmailVerificationToken" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- Unique index on tokenHash
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- Indexes for common lookups
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- Foreign key: cascade delete when User is deleted
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
