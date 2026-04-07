-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "public"."CurrencyCode" AS ENUM ('USD', 'UAH', 'RUB', 'EUR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "public"."Transaction"
ALTER COLUMN "currencyCode" DROP DEFAULT,
ALTER COLUMN "currencyCode" TYPE "public"."CurrencyCode"
USING (
    CASE UPPER("currencyCode")
        WHEN 'USD' THEN 'USD'::"public"."CurrencyCode"
        WHEN 'UAH' THEN 'UAH'::"public"."CurrencyCode"
        WHEN 'RUB' THEN 'RUB'::"public"."CurrencyCode"
        WHEN 'EUR' THEN 'EUR'::"public"."CurrencyCode"
        ELSE 'USD'::"public"."CurrencyCode"
    END
),
ALTER COLUMN "currencyCode" SET DEFAULT 'USD';
