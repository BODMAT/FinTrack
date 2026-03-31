import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CustomMessage, NoData, Spinner } from "@/shared/ui/Helpers";
import { motion } from "framer-motion";
import { sanitizeText, toLocalDatetimeString } from "@/utils/components";
import { TypingText } from "./TypingText";
import { FixedPanel } from "@/shared/portals/FixedPanel";
import { useAnalyticsAI } from "@/hooks/useAnalyticsAI";
import { useTransactionsAll } from "@/hooks/useTransactions";
import type { AIResponseWithDiff } from "@/types/ai";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

export function Analytics() {
  const { t } = useSafeTranslation();
  const [prompt, setPrompt] = useState<string>("");
  const { user, isLoading } = useAuth();

  const {
    data: transactionData,
    isLoading: isLoadingTransactions,
    error,
  } = useTransactionsAll({ userId: user?.id });

  const { history, isLoading: isLoadingAI, getResponse } = useAnalyticsAI();

  const handleAnalyze = useCallback(() => {
    if (!prompt || !transactionData?.data.length) return;
    const transactions = transactionData.data;
    getResponse({
      prompt,
      data: { transactions },
      model: "openai/gpt-oss-120b:cerebras",
    });
    setPrompt("");
  }, [prompt, transactionData, getResponse]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAnalyze]);

  if (isLoading || isLoadingTransactions) return <Spinner />;
  if (!user) return <CustomMessage message={t("analytics.notLoggedIn")} />;
  if (error) return <CustomMessage message={t("common.unexpected")} />;
  if (!transactionData) return <NoData />;

  return (
    <section className="w-full">
      <div className="relative">
        <h1 className="text-(--color-title) transitioned text-[32px] font-semibold mb-[24px]">
          {t("analytics.title")}
        </h1>

        {isLoadingAI && (
          <div className="h-[120px] w-[120px] overflow-hidden flex justify-center items-center mx-auto">
            <Spinner />
          </div>
        )}

        {history.map((item: AIResponseWithDiff, index) => {
          const isRecent =
            Math.abs(
              new Date().getTime() - new Date(item.getted_at).getTime(),
            ) < 60000;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="mt-[24px] text-(--color-text) px-[20px] py-[8px] border border-(--color-fixed-text) rounded max-w-[70%] max-sm:max-w-full w-fit items-end ml-auto flex flex-col justify-end">
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
                <div className="w-full italic text-right mt-[12px] text-(--color-placeholder)">
                  {toLocalDatetimeString(item.getted_at, true)}
                </div>
              </div>
              <div className="mt-[24px] text-(--color-text) px-[20px] py-[8px] border border-(--color-fixed-text) rounded max-w-[70%] max-sm:max-w-full">
                {index === 0 && isRecent ? (
                  <TypingText id={item.id} text={sanitizeText(item.result)} />
                ) : (
                  <>{sanitizeText(item.result)}</>
                )}
                <div className="w-full italic text-right mt-[12px] text-(--color-placeholder)">
                  {toLocalDatetimeString(item.getted_at, true)}
                </div>
              </div>
            </motion.div>
          );
        })}

        <FixedPanel>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed z-3 bottom-[20px] left-[320px] w-[calc(100%-340px)] max-md:left-[20px] max-md:w-[calc(100%-40px)]
                        bg-(--color-card)  rounded-[8px]xl border-2 border-(--color-fixed-text)
                        shadow-lg"
          >
            <div className="flex gap-[24px] my-[8px] mx-[12px] justify-between items-center">
              <textarea
                name="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("analytics.askPlaceholder")}
                id="prompt"
                className="w-full max-h-[192px] h-[48px] rounded-[5px] p-[12px] placeholder:text-(--color-placeholder)
                                text-(--color-text) scrollable resize-none transitioned text-[16px] font-semibold
                                focus:outline-none"
              />

              <button
                onClick={handleAnalyze}
                type="button"
                disabled={isLoadingAI}
                className="w-[120px] h-[48px] border border-(--color-fixed-text) rounded-[10px] p-[12px]
                                text-(--color-text) cursor-pointer transitioned
                                hover:bg-(--color-fixed-text) hover:text-(--color-card)
                                text-[16px] font-semibold"
              >
                {t("analytics.analyze")}
              </button>
            </div>
          </motion.div>
        </FixedPanel>
      </div>
    </section>
  );
}
