"use client";

import { useMemo, useRef, useState } from "react";
import type { MonobankAccount } from "@/types/monobank";
import { useMonobankCooldown } from "@/hooks/useMonobankCooldown";
import { useCurrency } from "@/hooks/useCurrency";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

type ActionMode = "PREVIEW" | "IMPORT";

interface MonobankAccountSelectPopupProps {
  accounts: MonobankAccount[];
  onContinue: (payload: {
    accountId: string;
    accountCurrencyCode?: number;
    mode: ActionMode;
  }) => Promise<void>;
}

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
  if (code === 643) return "RUB";
  return "USD";
}

export function MonobankAccountSelectPopup({
  accounts,
  onContinue,
}: MonobankAccountSelectPopupProps) {
  const { t } = useSafeTranslation();
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id ?? "",
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<ActionMode>("PREVIEW");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { isCooldownActive, remainingSeconds, startCooldown } =
    useMonobankCooldown();
  const { displayCurrency, convertAmount, formatMoney } = useCurrency();

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  const setSelectedIndex = (index: number) => {
    if (index < 0 || index >= accounts.length) return;
    const account = accounts[index];
    if (!account) return;
    setActiveIndex(index);
    setSelectedAccountId(account.id);

    const slider = sliderRef.current;
    const card = slider?.children.item(index) as HTMLElement | null;
    card?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handleContinue = async () => {
    if (!selectedAccountId) {
      setLocalError(t("monobank.selectOneAccount"));
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);
    try {
      if (isCooldownActive) {
        setLocalError(
          t("monobank.waitBeforeRequest", { seconds: remainingSeconds }),
        );
        return;
      }
      startCooldown(60);
      await onContinue({
        accountId: selectedAccountId,
        accountCurrencyCode: selectedAccount?.currencyCode,
        mode,
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-[14px]">
      <p className="text-(--color-fixed-text) text-[14px]">
        {t("monobank.selectAccountDesc")}
      </p>

      <div className="space-y-[10px]">
        <div className="flex items-center justify-between gap-[10px]">
          <button
            type="button"
            onClick={() => setSelectedIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="rounded-[10px] border border-(--stroke-soft) px-[12px] py-[8px] text-(--color-text) transitioned not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-55"
          >
            {"<"}
          </button>
          <p className="text-[12px] text-(--color-fixed-text)">
            {activeIndex + 1} / {accounts.length}
          </p>
          <button
            type="button"
            onClick={() => setSelectedIndex(activeIndex + 1)}
            disabled={activeIndex >= accounts.length - 1}
            className="rounded-[10px] border border-(--stroke-soft) px-[12px] py-[8px] text-(--color-text) transitioned not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-55"
          >
            {">"}
          </button>
        </div>

        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-[12px] overflow-x-auto pb-[6px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {accounts.map((account, index) => {
            const isSelected = selectedAccountId === account.id;
            return (
              <button
                type="button"
                key={account.id}
                onClick={() => setSelectedIndex(index)}
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
          })}
        </div>
      </div>

      <div className="rounded-[12px] border border-(--stroke-soft) p-[12px]">
        <p className="mb-[8px] text-(--color-text) text-[14px] font-semibold">
          {t("monobank.actionModeTitle")}
        </p>
        <label className="flex items-center gap-[8px] text-(--color-fixed-text)">
          <input
            type="radio"
            name="monobank-action-mode"
            checked={mode === "PREVIEW"}
            onChange={() => setMode("PREVIEW")}
          />
          {t("monobank.previewOnly")}
        </label>
        <label className="mt-[6px] flex items-center gap-[8px] text-(--color-fixed-text)">
          <input
            type="radio"
            name="monobank-action-mode"
            checked={mode === "IMPORT"}
            onChange={() => setMode("IMPORT")}
          />
          {t("monobank.saveToDb")}
        </label>
      </div>

      {selectedAccount && (
        <p className="text-(--color-fixed-text) text-[13px]">
          {t("monobank.selected")}:{" "}
          <b>{selectedAccount.maskedPan?.[0] ?? selectedAccount.id}</b>
        </p>
      )}

      {localError && (
        <p className="rounded-[10px] bg-(--bg-red) p-[10px] text-(--text-red) text-[13px]">
          {localError}
        </p>
      )}

      <button
        onClick={handleContinue}
        disabled={isSubmitting || isCooldownActive}
        className="bg-(--color-card) rounded-[10px] px-[16px] py-[10px] text-(--color-text) border border-(--color-fixed-text) transitioned not-disabled:cursor-pointer not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover)"
      >
        {isSubmitting
          ? t("monobank.loading")
          : isCooldownActive
            ? `${remainingSeconds}s`
            : t("monobank.submitRequest")}
      </button>
      <p className="text-[12px] text-(--color-fixed-text)">
        {t("monobank.cooldownLimit")}
      </p>
    </div>
  );
}
