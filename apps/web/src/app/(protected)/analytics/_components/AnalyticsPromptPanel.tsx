import { motion } from "framer-motion";
import { FixedPanel } from "@/shared/portals/FixedPanel";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface AnalyticsPromptPanelProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onAnalyze: () => void;
  isLoadingAI: boolean;
  isLimitReached: boolean;
}

export function AnalyticsPromptPanel({
  prompt,
  setPrompt,
  onAnalyze,
  isLoadingAI,
  isLimitReached,
}: AnalyticsPromptPanelProps) {
  const { t } = useSafeTranslation();

  return (
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
            onClick={onAnalyze}
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
  );
}
