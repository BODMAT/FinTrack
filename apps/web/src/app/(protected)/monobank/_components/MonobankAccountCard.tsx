"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import type { MonobankAccount } from "@/types/monobank";

function getCurrencyLabel(currencyCode?: number) {
  if (currencyCode === 980) return "UAH";
  if (currencyCode === 840) return "USD";
  if (currencyCode === 978) return "EUR";
  return currencyCode ? String(currencyCode) : "N/A";
}

function numericToAlpha(code?: number) {
  if (code === 980) return "UAH";
  if (code === 840) return "USD";
  if (code === 978) return "EUR";
  return "USD";
}

interface MonobankAccountCardProps {
  account: MonobankAccount;
  index: number;
  selectedAccountId: string;
  onSelect: (index: number) => void;
}

export function MonobankAccountCard({
  account,
  index,
  selectedAccountId,
  onSelect,
}: MonobankAccountCardProps) {
  const { t } = useSafeTranslation();
  const { displayCurrency, convertAmount, formatMoney } = useCurrency();
  const isSelected = selectedAccountId === account.id;

  return (
    <button
      type="button"
      key={account.id}
      onClick={() => onSelect(index)}
      className={`w-full min-w-[360px] snap-center rounded-[16px] border p-[16px] text-left transitioned aspect-[1.9/1] max-[640px]:min-w-[300px] max-[520px]:min-w-[270px] ${
        isSelected
          ? "border-(--color-hover) shadow-[0_0_0_1px_var(--color-hover)]"
          : "border-(--stroke-soft)"
      }`}
      style={{
        background:
          "linear-gradient(145deg, rgba(40,40,48,0.96) 0%, rgba(20,20,26,0.96) 100%)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] uppercase tracking-[1.2px] text-white/65">
          Monobank
        </span>
        <span className="rounded-[999px] border border-white/20 px-[8px] py-[2px] text-[11px] text-white/85">
          {account.type ?? "Card"}
        </span>
      </div>

      <p className="mt-[26px] text-[22px] font-semibold tracking-[2.2px] text-white">
        {account.maskedPan?.[0] ?? account.id.slice(0, 16)}
      </p>

      <div className="mt-[14px] grid grid-cols-2 gap-[8px] text-[12px] text-white/75">
        <div>
          <p className="uppercase">{t("monobank.balance")}</p>
          <p className="mt-[2px] text-[14px] font-semibold text-white">
            {formatMoney(
              convertAmount(
                Number(account.balance ?? 0) / 100,
                numericToAlpha(account.currencyCode),
                displayCurrency,
              ),
              displayCurrency,
            )}
          </p>
        </div>
        <div>
          <p className="uppercase">{t("monobank.creditLimit")}</p>
          <p className="mt-[2px] text-[14px] font-semibold text-white">
            {formatMoney(
              convertAmount(
                Number(account.creditLimit ?? 0) / 100,
                numericToAlpha(account.currencyCode),
                displayCurrency,
              ),
              displayCurrency,
            )}
          </p>
        </div>
      </div>

      <div className="mt-[12px] flex items-center justify-between text-[12px] text-white/70">
        <span>
          {t("monobank.accountCurrency")}:{" "}
          {getCurrencyLabel(account.currencyCode)}
        </span>
        <span className="truncate max-w-[110px]">
          {account.cashbackType ?? "cashback"}
        </span>
      </div>
    </button>
  );
}
