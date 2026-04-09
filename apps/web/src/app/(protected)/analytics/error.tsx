"use client";
import { useEffect } from "react";
import { captureClientError } from "@/lib/errorCapture";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface AnalyticsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AnalyticsError({ error, reset }: AnalyticsErrorProps) {
  const { t } = useSafeTranslation();

  useEffect(() => {
    captureClientError({
      source: "route:analytics:error-boundary",
      title: "Analytics route error",
      error,
    });
  }, [error]);

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-[16px] rounded-[10px] border border-(--color-fixed-text) p-[24px] text-center">
      <h2 className="text-[24px] font-semibold text-(--color-title)">
        {t("errors.failedAnalytics")}
      </h2>
      <p className="max-w-[560px] text-(--color-text)">
        {error.message || t("errors.unexpectedAnalytics")}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-[10px] border border-(--color-fixed-text) px-[16px] py-[8px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover)"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
