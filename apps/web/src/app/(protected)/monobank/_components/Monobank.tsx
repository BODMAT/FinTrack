"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useMonobankMutations,
  useTransactionsAll,
} from "@/hooks/useTransactions";
import { usePopupStore } from "@/store/popup";
import { CustomMessage } from "@/shared/ui/Helpers";
import { useMonobankCooldown } from "@/hooks/useMonobankCooldown";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { MonobankContent } from "./MonobankContent";
import type { StatsTransaction } from "@/types/monobank-ui";
import { useMonobankActions } from "./useMonobankActions";

export function Monobank() {
  const { t } = useSafeTranslation();
  const { user } = useAuth();
  const { open, close } = usePopupStore();
  const {
    fetchMonobankAccountsData,
    isFetchingMonobankAccounts,
    fetchMonobankData,
    importMonobankData,
    deleteMonobankData,
    isDeletingMonobankData,
    fetchMonobankError,
    importMonobankError,
    deleteMonobankError,
  } = useMonobankMutations();
  const { data: savedMonobankData } = useTransactionsAll({
    userId: user?.id,
    source: "MONOBANK",
  });
  const { isCooldownActive, remainingSeconds, startCooldown } =
    useMonobankCooldown();

  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [previewTransactions, setPreviewTransactions] = useState<
    StatsTransaction[]
  >([]);

  const transactions = useMemo<StatsTransaction[]>(() => {
    if (previewTransactions.length > 0) return previewTransactions;

    return (savedMonobankData?.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      amount: Number(item.amount),
      currencyCode: item.currencyCode ?? "USD",
      createdAt: item.created_at ? new Date(item.created_at) : new Date(0),
    }));
  }, [previewTransactions, savedMonobankData]);

  const { handleFetchAccounts, handleDeleteMonobankData } = useMonobankActions({
    token,
    transactions,
    isCooldownActive,
    remainingSeconds,
    fetchMonobankError,
    importMonobankError,
    deleteMonobankError,
    fetchMonobankAccountsData,
    fetchMonobankData,
    importMonobankData,
    deleteMonobankData,
    startCooldown,
    setTokenError,
    setPreviewTransactions,
    open,
    close,
    t,
  });

  if (!user) {
    return <CustomMessage message="Please login to use Monobank API." />;
  }

  return (
    <MonobankContent
      token={token}
      tokenError={tokenError}
      isFetchingMonobankAccounts={isFetchingMonobankAccounts}
      isCooldownActive={isCooldownActive}
      remainingSeconds={remainingSeconds}
      isDeletingMonobankData={isDeletingMonobankData}
      transactions={transactions}
      onTokenChange={setToken}
      onSubmit={handleFetchAccounts}
      onDelete={() => {
        void handleDeleteMonobankData();
      }}
    />
  );
}
