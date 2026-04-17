import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalyticsAI } from "@/hooks/useAnalyticsAI";
import { useTransactionsAll } from "@/hooks/useTransactions";
import { useUserApiKey } from "@/hooks/useUserApiKey";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { usePopupStore } from "@/store/popup";
import { useAiAccess } from "@/hooks/useAiAccess";
import type { AiErrorCode } from "@/types/ai";
import type { ApiError } from "@/types/api";
import { ApiKeyPopup } from "./ApiKeyPopup";
import { AiErrorPopup } from "./AiErrorPopup";
import { AiLimitPopup } from "./AiLimitPopup";
import { AnalyticsContent } from "./AnalyticsContent";
import { AnalyticsStateBoundary } from "./AnalyticsStateBoundary";
import { getLatestMessageIndex, isAiErrorCode } from "@/utils/analytics";

export function Analytics() {
  const { t } = useSafeTranslation();
  const [prompt, setPrompt] = useState<string>("");
  const [hasShownDefaultKeyNotice, setHasShownDefaultKeyNotice] =
    useState(false);

  const { user, isLoading } = useAuth();
  const { hasActiveKey } = useUserApiKey();
  const { open } = usePopupStore();
  const { data: access } = useAiAccess();
  const isLimitReached = access
    ? !access.isUnlimited && (access.remainingAttempts ?? 0) <= 0
    : false;

  const {
    data: transactionData,
    isLoading: isLoadingTransactions,
    error,
  } = useTransactionsAll({ userId: user?.id });

  const { history, isLoading: isLoadingAI, getResponse } = useAnalyticsAI();

  const handleOpenErrorPopup = useCallback(
    (errorCode: AiErrorCode) => {
      open(t("errors.error"), <AiErrorPopup code={errorCode} />);
    },
    [open, t],
  );

  const latestMessageIndex = getLatestMessageIndex(history);

  const handleAnalyze = useCallback(async () => {
    if (!prompt || !transactionData?.data.length) return;

    if (!hasActiveKey && !hasShownDefaultKeyNotice) {
      setHasShownDefaultKeyNotice(true);
      handleOpenErrorPopup("USING_DEFAULT_KEY");
    }

    const transactions = transactionData.data;
    try {
      await getResponse({
        prompt,
        data: { transactions },
      });
      setPrompt("");
    } catch (err: unknown) {
      const statusCode = (err as ApiError)?.code;
      if (statusCode === 403) {
        open("AI limit reached", <AiLimitPopup />);
        return;
      }

      const code = (err as { backendCode?: unknown; code?: unknown })
        ?.backendCode;
      const fallbackCode = (err as { code?: unknown })?.code;
      const aiCode = isAiErrorCode(code)
        ? code
        : isAiErrorCode(fallbackCode)
          ? fallbackCode
          : null;
      if (aiCode) {
        handleOpenErrorPopup(aiCode);
      }
    }
  }, [
    getResponse,
    handleOpenErrorPopup,
    hasActiveKey,
    hasShownDefaultKeyNotice,
    open,
    prompt,
    transactionData,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleAnalyze();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAnalyze]);

  const handleOpenAPIKeyPopup = () => {
    open(t("analytics.addApiKey"), <ApiKeyPopup />);
  };

  return (
    <AnalyticsStateBoundary
      isAuthLoading={isLoading}
      isTransactionsLoading={isLoadingTransactions}
      user={user}
      transactionsError={!!error}
      transactionData={transactionData}
    >
      <AnalyticsContent
        user={user!}
        history={history}
        hasActiveKey={hasActiveKey}
        isLimitReached={isLimitReached}
        isUnlimited={access?.isUnlimited ?? false}
        remainingAttempts={access?.remainingAttempts ?? 0}
        aiAnalysisLimit={access?.aiAnalysisLimit ?? 10}
        latestMessageIndex={latestMessageIndex}
        isLoadingAI={isLoadingAI}
        prompt={prompt}
        setPrompt={setPrompt}
        onAnalyze={() => void handleAnalyze()}
        onOpenApiKeyPopup={handleOpenAPIKeyPopup}
      />
    </AnalyticsStateBoundary>
  );
}
