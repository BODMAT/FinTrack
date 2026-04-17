import type { AIResponseWithDiff, AiErrorCode } from "@/types/ai";
import { toLocalDatetimeString } from "@/utils/components";

export function isAiErrorCode(value: unknown): value is AiErrorCode {
  return (
    value === "USER_KEY_LIMIT" ||
    value === "USER_KEY_INVALID" ||
    value === "DEFAULT_KEY_LIMIT" ||
    value === "ALL_KEYS_FAILED" ||
    value === "USING_DEFAULT_KEY"
  );
}

export function getLatestMessageIndex(history: AIResponseWithDiff[]) {
  return history.reduce((latestIndex, message, index) => {
    const currentTime = new Date(message.getted_at).getTime();
    if (!Number.isFinite(currentTime)) return latestIndex;

    if (latestIndex < 0) return index;

    const latestTime = new Date(history[latestIndex]?.getted_at).getTime();
    if (!Number.isFinite(latestTime) || currentTime > latestTime) {
      return index;
    }

    return latestIndex;
  }, -1);
}

export function formatAnalyticsDate(dateInput: Date) {
  const date = new Date(dateInput);
  if (Number.isFinite(date.getTime())) {
    return toLocalDatetimeString(date, true);
  }
  return toLocalDatetimeString(new Date(), true);
}
