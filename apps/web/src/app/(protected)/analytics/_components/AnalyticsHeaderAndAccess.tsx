import Link from "next/link";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface AnalyticsHeaderAndAccessProps {
  hasActiveKey: boolean;
  isLimitReached: boolean;
  isUnlimited: boolean;
  remainingAttempts: number;
  aiAnalysisLimit: number;
  onOpenApiKeyPopup: () => void;
}

export function AnalyticsHeaderAndAccess({
  hasActiveKey,
  isLimitReached,
  isUnlimited,
  remainingAttempts,
  aiAnalysisLimit,
  onOpenApiKeyPopup,
}: AnalyticsHeaderAndAccessProps) {
  const { t } = useSafeTranslation();

  return (
    <>
      <div className="flex items-center justify-between mb-[24px]">
        <h1 className="text-[var(--color-title)] transition-all text-[32px] font-semibold">
          {t("analytics.title")}
        </h1>

        <button
          onClick={onOpenApiKeyPopup}
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
        {isUnlimited ? (
          <p className="text-[14px] font-semibold text-(--text-green)">
            Unlimited AI analytics access is active.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-[10px]">
            <p className="text-[14px] text-(--color-text)">
              Remaining attempts:{" "}
              <span className="font-semibold text-(--color-hover)">
                {remainingAttempts}
              </span>{" "}
              of {aiAnalysisLimit}
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
    </>
  );
}
