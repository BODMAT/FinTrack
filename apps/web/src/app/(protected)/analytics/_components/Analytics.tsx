import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { CustomMessage, NoData, Spinner } from "@/shared/ui/Helpers";
import { motion } from "framer-motion";
import { sanitizeText, toLocalDatetimeString } from "@/utils/components";
import { TypingText } from "./TypingText";
import { FixedPanel } from "@/shared/portals/FixedPanel";
import { useAnalyticsAI } from "@/hooks/useAnalyticsAI";
import { useTransactionsAll } from "@/hooks/useTransactions";
import { useUserApiKey } from "@/hooks/useUserApiKey";
import { ApiKeyPopup } from "./ApiKeyPopup";
import { AiErrorPopup } from "./AiErrorPopup";
import { AiLimitPopup } from "./AiLimitPopup";
import type { AIResponseWithDiff, AiErrorCode } from "@/types/ai";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { usePopupStore } from "@/store/popup";
import { useAiAccess } from "@/hooks/useAiAccess";
import type { ApiError } from "@/types/api";

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

  function isAiErrorCode(value: unknown): value is AiErrorCode {
    return (
      value === "USER_KEY_LIMIT" ||
      value === "USER_KEY_INVALID" ||
      value === "DEFAULT_KEY_LIMIT" ||
      value === "ALL_KEYS_FAILED" ||
      value === "USING_DEFAULT_KEY"
    );
  }

  const handleOpenErrorPopup = useCallback(
    (errorCode: AiErrorCode) => {
      open(t("errors.error"), <AiErrorPopup code={errorCode} />);
    },
    [open, t],
  );

  const latestMessageIndex = history.reduce((latestIndex, message, index) => {
    const currentTime = new Date(message.getted_at).getTime();
    if (!Number.isFinite(currentTime)) return latestIndex;

    if (latestIndex < 0) return index;

    const latestTime = new Date(history[latestIndex]?.getted_at).getTime();
    if (!Number.isFinite(latestTime) || currentTime > latestTime) {
      return index;
    }

    return latestIndex;
  }, -1);

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

  const formatAnalyticsDate = (dateInput: Date) => {
    const date = new Date(dateInput);
    if (Number.isFinite(date.getTime())) {
      return toLocalDatetimeString(date, true);
    }
    return toLocalDatetimeString(new Date(), true);
  };

  if (isLoading || isLoadingTransactions) return <Spinner />;
  if (!user) return <CustomMessage message={t("analytics.notLoggedIn")} />;
  if (error) return <CustomMessage message={t("common.unexpected")} />;
  if (!transactionData) return <NoData />;

  return (
    <section className="w-full">
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-[24px]">
          <h1 className="text-[var(--color-title)] transition-all text-[32px] font-semibold">
            {t("analytics.title")}
          </h1>

          <button
            onClick={handleOpenAPIKeyPopup}
            className={`flex items-center gap-[8px] px-[12px] h-[36px] rounded-[10px] border
            text-[13px] font-semibold transition-all cursor-pointer
            ${
              hasActiveKey
                ? "border-[var(--color-hover)] text-[var(--color-hover)] bg-[var(--color-hover-reverse)]"
                : "border-[var(--color-fixed-text)] text-[var(--color-fixed-text)] hover:border-[var(--color-hover)] hover:text-[var(--color-hover)]"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            {t("analytics.apiKeyButton")}
            {hasActiveKey && (
              <span className="w-[6px] h-[6px] rounded-full bg-green-500" />
            )}
          </button>
        </div>

        <div className="mb-[20px] rounded-[12px] border border-(--stroke-soft) bg-(--color-input) p-[14px]">
          {access?.isUnlimited ? (
            <p className="text-[14px] font-semibold text-(--text-green)">
              Unlimited AI analytics access is active.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-[10px]">
              <p className="text-[14px] text-(--color-text)">
                Remaining attempts:{" "}
                <span className="font-semibold text-(--color-hover)">
                  {access?.remainingAttempts ?? 0}
                </span>{" "}
                of {access?.aiAnalysisLimit ?? 10}
              </p>
              <Link
                href="/donation"
                className="rounded-[10px] border border-(--color-fixed-text) px-[12px] py-[7px] text-[13px] font-semibold text-(--color-text) transition-all hover:border-(--color-hover) hover:text-(--color-hover)"
              >
                Donation Stripe
              </Link>
            </div>
          )}
        </div>

        {isLimitReached && (
          <div className="mb-[18px] rounded-[12px] border border-(--text-red) bg-(--bg-red) p-[14px]">
            <div className="flex flex-wrap items-center justify-between gap-[10px]">
              <p className="text-[14px] font-semibold text-(--text-red)">
                Free AI limit is exhausted. Donate to unlock unlimited access.
              </p>
              <Link
                href="/donation"
                className="rounded-[10px] border border-(--text-red) px-[12px] py-[7px] text-[13px] font-semibold text-(--text-red) transition-all hover:opacity-80"
              >
                Open Donation Stripe
              </Link>
            </div>
          </div>
        )}

        {isLoadingAI && (
          <div className="h-[120px] w-[120px] overflow-hidden flex justify-center items-center mx-auto">
            <Spinner />
          </div>
        )}

        {/* History analysis */}
        <div className="pb-[120px]">
          {history.map((item: AIResponseWithDiff, index) => {
            const currentDate = formatAnalyticsDate(item.getted_at);
            const isLatestMessage = index === latestMessageIndex;

            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="mb-[24px]"
              >
                {/* User Message */}
                <div className="text-[var(--color-text)] px-[20px] py-[8px] border border-[var(--color-fixed-text)] rounded-[10px] max-w-[70%] max-sm:max-w-full w-fit ml-auto flex flex-col items-end">
                  <div className="flex flex-row-reverse items-center gap-[12px]">
                    {user.photo_url && (
                      <img
                        src={user.photo_url}
                        className="w-[32px] h-[32px] rounded-full"
                        alt={user.name || "User"}
                      />
                    )}
                    <div>{item.prompt}</div>
                  </div>
                  <div className="w-full italic text-right mt-[12px] text-[var(--color-placeholder)] text-[12px]">
                    {currentDate}
                  </div>
                </div>

                {/* AI Response */}
                <div className="mt-[24px] text-[var(--color-text)] px-[20px] py-[8px] border border-[var(--color-fixed-text)] rounded-[10px] max-w-[70%] max-sm:max-w-full bg-[var(--color-card)]/50">
                  {isLatestMessage ? (
                    <TypingText id={item.id} text={sanitizeText(item.result)} />
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {sanitizeText(item.result)}
                    </p>
                  )}
                  <div className="w-full italic text-right mt-[12px] text-[var(--color-placeholder)] text-[12px]">
                    {currentDate}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <FixedPanel>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed z-[30] bottom-[20px] left-[320px] w-[calc(100%-340px)] max-md:left-[20px] max-md:w-[calc(100%-40px)]
                      bg-[var(--color-card)] rounded-xl border-2 border-[var(--color-fixed-text)] shadow-lg"
          >
            <div className="flex flex-col sm:flex-row gap-[12px] sm:gap-[24px] my-[8px] mx-[12px] justify-between sm:items-center">
              <textarea
                name="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("analytics.askPlaceholder")}
                className="w-full max-h-[192px] min-h-[48px] h-[48px] rounded-[5px] p-[12px] placeholder:text-[var(--color-placeholder)]
                              text-[var(--color-text)] scrollable resize-none transition-all text-[16px] font-semibold
                              focus:outline-none bg-transparent"
              />
              <button
                onClick={() => void handleAnalyze()}
                type="button"
                disabled={isLoadingAI || !prompt.trim() || isLimitReached}
                className="w-full sm:w-auto sm:min-w-[120px] h-[48px] border border-[var(--color-fixed-text)] rounded-[10px] px-[16px]
                              text-[var(--color-text)] cursor-pointer transition-all
                              hover:bg-[var(--color-fixed-text)] hover:text-[var(--color-card)]
                              disabled:opacity-50 disabled:cursor-not-allowed
                              text-[clamp(12px,1.8vw,16px)] font-semibold whitespace-nowrap"
              >
                {isLoadingAI ? t("common.loading") : t("analytics.analyze")}
              </button>
            </div>
          </motion.div>
        </FixedPanel>
      </div>
    </section>
  );
}
