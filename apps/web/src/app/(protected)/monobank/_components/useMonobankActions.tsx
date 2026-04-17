import type { ActionMode, StatsTransaction } from "@/types/monobank-ui";
import type { MonobankPreviewTransaction } from "@/types/monobank";
import type { ReactNode, Dispatch, SetStateAction, FormEvent } from "react";
import { MonobankAccountSelectPopup } from "./MonobankAccountSelectPopup";
import { MonobankResultPopup } from "./MonobankResultPopup";
import { extractErrorMessage, mergeUniqueTransactions } from "@/utils/monobank";

interface UseMonobankActionsParams {
  token: string;
  transactions: StatsTransaction[];
  isCooldownActive: boolean;
  remainingSeconds: number;
  fetchMonobankError?: string;
  importMonobankError?: string;
  deleteMonobankError?: string;
  fetchMonobankAccountsData: (payload: { token: string }) => Promise<{
    accounts: {
      id: string;
      type?: string;
      currencyCode?: number;
      cashbackType?: string;
      balance?: number;
      creditLimit?: number;
      maskedPan?: string[];
      iban?: string;
    }[];
  }>;
  fetchMonobankData: (payload: {
    token: string;
    accountId: string;
    accountCurrencyCode?: number;
    from: number;
    to: number;
  }) => Promise<{
    transactions: MonobankPreviewTransaction[];
  }>;
  importMonobankData: (payload: {
    transactions: MonobankPreviewTransaction[];
  }) => Promise<{
    imported: number;
    skipped: number;
  }>;
  deleteMonobankData: () => Promise<{ deleted: number }>;
  startCooldown: (seconds: number) => void;
  setTokenError: (value: string) => void;
  setPreviewTransactions: Dispatch<SetStateAction<StatsTransaction[]>>;
  open: (title: string, content: ReactNode) => void;
  close: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export function useMonobankActions({
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
}: UseMonobankActionsParams) {
  const openResultPopup = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    open(
      title,
      <MonobankResultPopup type={type} title={title} message={message} />,
    );
  };

  const runAfterAccountSelection = async (params: {
    token: string;
    accountId: string;
    accountCurrencyCode?: number;
    mode: ActionMode;
  }) => {
    const now = Math.floor(Date.now() / 1000);
    const from = now - (2_682_000 - 3600);

    try {
      const statement = await fetchMonobankData({
        token: params.token,
        accountId: params.accountId,
        accountCurrencyCode: params.accountCurrencyCode,
        from,
        to: now,
      });

      const mappedPreview = statement.transactions.map(
        (item: MonobankPreviewTransaction) => ({
          id: item.sourceTransactionId,
          title: item.title,
          type: item.type,
          amount: item.amount,
          currencyCode: item.currencyCode,
          createdAt: new Date(item.created_at),
        }),
      );

      if (params.mode === "IMPORT") {
        const importResult = await importMonobankData({
          transactions: statement.transactions,
        });
        setPreviewTransactions((current) => {
          const base = current.length > 0 ? current : transactions;
          return mergeUniqueTransactions(base, mappedPreview);
        });
        openResultPopup(
          "success",
          t("monobank.importCompleted"),
          t("monobank.importCompletedMessage", {
            loaded: statement.transactions.length,
            imported: importResult.imported,
            skipped: importResult.skipped,
          }),
        );
        return;
      }

      setPreviewTransactions(mappedPreview);
      openResultPopup(
        "success",
        t("monobank.previewReady"),
        t("monobank.previewReadyMessage", {
          loaded: statement.transactions.length,
        }),
      );
    } catch (error) {
      const message =
        extractErrorMessage(error) ||
        importMonobankError ||
        fetchMonobankError ||
        "Operation failed.";
      openResultPopup("error", t("monobank.requestFailed"), message);
      throw new Error(message);
    }
  };

  const handleFetchAccounts = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedToken = token.trim();

    if (trimmedToken.length < 20) {
      setTokenError(t("monobank.tokenInvalid"));
      return;
    }

    setTokenError("");

    if (isCooldownActive) {
      setTokenError(
        t("monobank.waitBeforeRequest", { seconds: remainingSeconds }),
      );
      return;
    }

    try {
      startCooldown(60);
      const response = await fetchMonobankAccountsData({ token: trimmedToken });

      open(
        t("monobank.selectAccountTitle"),
        <MonobankAccountSelectPopup
          accounts={response.accounts}
          onContinue={async ({ accountId, accountCurrencyCode, mode }) => {
            close();
            await runAfterAccountSelection({
              token: trimmedToken,
              accountId,
              accountCurrencyCode,
              mode,
            });
          }}
        />,
      );
    } catch (error) {
      openResultPopup(
        "error",
        t("monobank.tokenCheckFailed"),
        extractErrorMessage(error),
      );
    }
  };

  const handleDeleteMonobankData = async () => {
    try {
      const result = await deleteMonobankData();
      setPreviewTransactions([]);
      openResultPopup(
        "success",
        t("monobank.dataRemoved"),
        t("monobank.removedMessage", { deleted: result.deleted }),
      );
    } catch (error) {
      openResultPopup(
        "error",
        t("monobank.deleteFailed"),
        extractErrorMessage(error) || deleteMonobankError || "Delete failed.",
      );
    }
  };

  return {
    handleFetchAccounts,
    handleDeleteMonobankData,
  };
}
