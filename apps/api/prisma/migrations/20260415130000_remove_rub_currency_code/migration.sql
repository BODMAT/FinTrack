-- Map legacy RUB data to EUR before removing RUB from enum
UPDATE "Transaction"
SET "currencyCode" = 'EUR'
WHERE "currencyCode" = 'RUB';

-- Recreate enum without RUB
ALTER TYPE "public"."CurrencyCode" RENAME TO "CurrencyCode_old";
CREATE TYPE "public"."CurrencyCode" AS ENUM ('USD', 'UAH', 'EUR');

ALTER TABLE "Transaction"
ALTER COLUMN "currencyCode" DROP DEFAULT,
ALTER COLUMN "currencyCode" TYPE "public"."CurrencyCode"
USING ("currencyCode"::text::"public"."CurrencyCode");

ALTER TABLE "Transaction"
ALTER COLUMN "currencyCode" SET DEFAULT 'USD';

DROP TYPE "public"."CurrencyCode_old";
