import { motion } from "framer-motion";
import { sanitizeText } from "@/utils/components";
import { TypingText } from "./TypingText";
import type { AIResponseWithDiff } from "@/types/ai";
import type { UserResponse } from "@fintrack/types";
import { formatAnalyticsDate } from "@/utils/analytics";

interface AnalyticsHistoryListProps {
  history: AIResponseWithDiff[];
  latestMessageIndex: number;
  user: UserResponse;
}

export function AnalyticsHistoryList({
  history,
  latestMessageIndex,
  user,
}: AnalyticsHistoryListProps) {
  return (
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
  );
}
