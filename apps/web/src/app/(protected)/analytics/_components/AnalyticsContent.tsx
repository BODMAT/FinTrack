import { Spinner } from "@/shared/ui/Helpers";
import { AnalyticsHeaderAndAccess } from "./AnalyticsHeaderAndAccess";
import { AnalyticsHistoryList } from "./AnalyticsHistoryList";
import { AnalyticsPromptPanel } from "./AnalyticsPromptPanel";
import type { AIResponseWithDiff } from "@/types/ai";
import type { UserResponse } from "@fintrack/types";

interface AnalyticsContentProps {
  user: UserResponse;
  history: AIResponseWithDiff[];
  hasActiveKey: boolean;
  isLimitReached: boolean;
  isUnlimited: boolean;
  remainingAttempts: number;
  aiAnalysisLimit: number;
  latestMessageIndex: number;
  isLoadingAI: boolean;
  prompt: string;
  setPrompt: (value: string) => void;
  onAnalyze: () => void;
  onOpenApiKeyPopup: () => void;
}

export function AnalyticsContent({
  user,
  history,
  hasActiveKey,
  isLimitReached,
  isUnlimited,
  remainingAttempts,
  aiAnalysisLimit,
  latestMessageIndex,
  isLoadingAI,
  prompt,
  setPrompt,
  onAnalyze,
  onOpenApiKeyPopup,
}: AnalyticsContentProps) {
  return (
    <section className="w-full">
      <div className="relative">
        <AnalyticsHeaderAndAccess
          hasActiveKey={hasActiveKey}
          isLimitReached={isLimitReached}
          isUnlimited={isUnlimited}
          remainingAttempts={remainingAttempts}
          aiAnalysisLimit={aiAnalysisLimit}
          onOpenApiKeyPopup={onOpenApiKeyPopup}
        />

        {isLoadingAI && (
          <div className="h-[120px] w-[120px] overflow-hidden flex justify-center items-center mx-auto">
            <Spinner />
          </div>
        )}

        <AnalyticsHistoryList
          history={history}
          latestMessageIndex={latestMessageIndex}
          user={user}
        />

        <AnalyticsPromptPanel
          prompt={prompt}
          setPrompt={setPrompt}
          onAnalyze={onAnalyze}
          isLoadingAI={isLoadingAI}
          isLimitReached={isLimitReached}
        />
      </div>
    </section>
  );
}
