"use client";

import { useMemo, useRef, useState } from "react";
import type { MonobankAccount } from "@/types/monobank";
import { useMonobankCooldown } from "@/hooks/useMonobankCooldown";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { MonobankAccountCard } from "./MonobankAccountCard";
import type { ActionMode } from "@/types/monobank-ui";

interface MonobankAccountSelectPopupProps {
  accounts: MonobankAccount[];
  onContinue: (payload: {
    accountId: string;
    accountCurrencyCode?: number;
    mode: ActionMode;
  }) => Promise<void>;
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
          {accounts.map((account, index) => (
            <MonobankAccountCard
              key={account.id}
              account={account}
              index={index}
              selectedAccountId={selectedAccountId}
              onSelect={setSelectedIndex}
            />
          ))}
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
