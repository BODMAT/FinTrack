"use client";

import { useMonobankMutations } from "@/hooks/useTransactions";
import type { MonobankPreviewTransaction } from "@/types/monobank";
import { usePopupStore } from "@/store/popup";

interface MonobankImportPopupProps {
  transactions: MonobankPreviewTransaction[];
  onSaved: (message: string) => void;
}

export function MonobankImportPopup({
  transactions,
  onSaved,
}: MonobankImportPopupProps) {
  const { close } = usePopupStore();
  const { importMonobankData, isImportingMonobankData, importMonobankError } =
    useMonobankMutations();

  const handleSave = async () => {
    try {
      const result = await importMonobankData({ transactions });
      onSaved(
        `Imported ${result.imported}. Skipped duplicates ${result.skipped}. Total ${result.total}.`,
      );
      close();
    } catch {
      // Error is rendered from importMonobankError
    }
  };

  return (
    <div className="space-y-[16px]">
      <p className="text-(--color-fixed-text) text-[16px]">
        Data loaded successfully. Save transactions to your database?
      </p>
      <p className="rounded-[12px] bg-(--color-input) p-[12px] text-(--color-text) text-[14px]">
        Transactions in batch: <b>{transactions.length}</b>
      </p>
      {importMonobankError && (
        <p className="rounded-[12px] bg-(--bg-red) p-[12px] text-(--text-red) text-[14px]">
          {importMonobankError}
        </p>
      )}
      <div className="flex gap-[10px] max-[480px]:flex-col">
        <button
          onClick={handleSave}
          disabled={isImportingMonobankData}
          className="bg-(--color-card) rounded-[10px] px-[16px] py-[10px] text-(--color-text) border border-(--color-fixed-text) transitioned not-disabled:cursor-pointer not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover)"
        >
          {isImportingMonobankData ? "Saving..." : "Yes, save to DB"}
        </button>
        <button
          onClick={close}
          disabled={isImportingMonobankData}
          className="rounded-[10px] px-[16px] py-[10px] text-(--color-fixed-text) border border-(--stroke-soft) transitioned not-disabled:cursor-pointer not-disabled:hover:text-(--color-hover)"
        >
          No, keep only preview
        </button>
      </div>
    </div>
  );
}
