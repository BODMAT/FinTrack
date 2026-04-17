"use client";

import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface DonationCardsProps {
  isCheckoutPending: boolean;
  onDonate: () => void;
  tierLabel: string;
  isUnlimited: boolean;
  remainingAttempts: number;
  aiAnalysisLimit: number;
}

export function DonationCards({
  isCheckoutPending,
  onDonate,
  tierLabel,
  isUnlimited,
  remainingAttempts,
  aiAnalysisLimit,
}: DonationCardsProps) {
  const { t } = useSafeTranslation();

  return (
    <div className="grid grid-cols-2 gap-[16px] max-[980px]:grid-cols-1">
      <article className="neo-panel p-[18px]">
        <h2 className="text-(--color-text) text-[20px] font-semibold">
          {t("donation.benefitsTitle")}
        </h2>
        <ul className="mt-[10px] list-disc space-y-[6px] pl-[20px] text-(--color-fixed-text) text-[14px]">
          <li>{t("donation.benefit1")}</li>
          <li>{t("donation.benefit2")}</li>
          <li>{t("donation.benefit3")}</li>
        </ul>

        <button
          type="button"
          onClick={onDonate}
          disabled={isCheckoutPending}
          className="mt-[16px] rounded-[10px] border border-(--color-fixed-text) px-[16px] py-[10px] text-[14px] font-semibold text-(--color-text) transition-all not-disabled:cursor-pointer not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover) disabled:opacity-55"
        >
          {isCheckoutPending
            ? t("donation.redirectingButton")
            : t("donation.donateButton")}
        </button>
      </article>

      <article className="neo-panel p-[18px]">
        <h2 className="text-(--color-text) text-[20px] font-semibold">
          {t("donation.accessStatusTitle")}
        </h2>
        <p className="mt-[10px] text-(--color-text)">
          {t("donation.currentTier")}:{" "}
          <span className="font-semibold text-(--color-hover)">
            {tierLabel}
          </span>
        </p>

        {isUnlimited ? (
          <p className="mt-[8px] text-[14px] font-semibold text-(--text-green)">
            {t("donation.unlimitedActive")}
          </p>
        ) : (
          <p className="mt-[8px] text-[14px] text-(--color-fixed-text)">
            {t("donation.remainingAttempts", {
              remaining: remainingAttempts,
              limit: aiAnalysisLimit,
            })}
          </p>
        )}

        <div className="mt-[14px] rounded-[10px] border border-(--stroke-soft) bg-(--color-input) p-[12px] text-[13px] text-(--color-fixed-text)">
          {t("donation.faq")}
        </div>
      </article>
    </div>
  );
}
