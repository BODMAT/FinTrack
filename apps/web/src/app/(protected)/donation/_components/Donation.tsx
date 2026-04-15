"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePopupStore } from "@/store/popup";
import {
  createDonationCheckoutSession,
  getDonationLeaderboard,
} from "@/api/donation";
import { useAiAccess } from "@/hooks/useAiAccess";
import { DonationResultPopup } from "./DonationResultPopup";
import { queryClient } from "@/api/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { CustomMessage, Spinner } from "@/shared/ui/Helpers";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

function createIdempotencyKey() {
  return crypto.randomUUID();
}

export function Donation() {
  const { user, isLoading } = useAuth();
  const { t } = useSafeTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { open } = usePopupStore();
  const { data: access } = useAiAccess();
  const leaderboardQuery = useQuery({
    queryKey: ["donation-leaderboard"],
    queryFn: getDonationLeaderboard,
    enabled: !!user,
  });

  const status = searchParams.get("status");

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const idempotencyKey = createIdempotencyKey();
      return createDonationCheckoutSession(idempotencyKey);
    },
    onSuccess: (result) => {
      window.location.assign(result.checkoutUrl);
    },
    onError: () => {
      open(
        t("donation.failedTitle"),
        <DonationResultPopup
          type="error"
          title={t("donation.failedPopupTitle")}
          message={t("donation.failedPopupMessage")}
        />,
      );
    },
  });

  useEffect(() => {
    if (!status) return;

    if (status === "success") {
      open(
        t("donation.successTitle"),
        <DonationResultPopup
          type="success"
          title={t("donation.successPopupTitle")}
          message={t("donation.successPopupMessage")}
        />,
      );
      void queryClient.invalidateQueries({ queryKey: ["ai-access"] });
    }

    if (status === "cancel") {
      open(
        t("donation.canceledTitle"),
        <DonationResultPopup
          type="error"
          title={t("donation.canceledPopupTitle")}
          message={t("donation.canceledPopupMessage")}
        />,
      );
    }

    router.replace(pathname);
  }, [open, pathname, router, status, t]);

  const tierLabel = useMemo(() => {
    if (access?.tier === "admin") return t("donation.tier.admin");
    if (access?.tier === "donor") return t("donation.tier.donor");
    return t("donation.tier.user");
  }, [access?.tier, t]);

  const leaderboardItems = leaderboardQuery.data?.items ?? [];
  const marqueeItems =
    leaderboardItems.length > 1
      ? [...leaderboardItems, ...leaderboardItems]
      : leaderboardItems;

  const formatDonationAmount = (amountMinor: number, currency: string) => {
    const normalized = currency?.toUpperCase() || "USD";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: normalized,
      }).format(amountMinor / 100);
    } catch {
      return `${(amountMinor / 100).toFixed(2)} ${normalized}`;
    }
  };

  if (isLoading) return <Spinner />;
  if (!user) return <CustomMessage message={t("donation.notLoggedIn")} />;

  return (
    <section className="w-full space-y-[18px]">
      <div className="neo-panel neo-panel-glow p-[22px]">
        <h1 className="text-(--color-title) text-[30px] font-semibold">
          {t("donation.pageTitle")}
        </h1>
        <p className="mt-[8px] text-(--color-fixed-text) text-[15px]">
          {t("donation.pageDescription")}
        </p>
      </div>

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
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            className="mt-[16px] rounded-[10px] border border-(--color-fixed-text) px-[16px] py-[10px] text-[14px] font-semibold text-(--color-text) transition-all not-disabled:cursor-pointer not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover) disabled:opacity-55"
          >
            {checkoutMutation.isPending
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

          {access?.isUnlimited ? (
            <p className="mt-[8px] text-[14px] font-semibold text-(--text-green)">
              {t("donation.unlimitedActive")}
            </p>
          ) : (
            <p className="mt-[8px] text-[14px] text-(--color-fixed-text)">
              {t("donation.remainingAttempts", {
                remaining: access?.remainingAttempts ?? 0,
                limit: access?.aiAnalysisLimit ?? 10,
              })}
            </p>
          )}

          <div className="mt-[14px] rounded-[10px] border border-(--stroke-soft) bg-(--color-input) p-[12px] text-[13px] text-(--color-fixed-text)">
            {t("donation.faq")}
          </div>
        </article>
      </div>

      <section className="neo-panel p-[18px] overflow-hidden max-w-full">
        <h2 className="text-(--color-text) text-[20px] font-semibold mb-[12px]">
          {t("donation.leaderboardTitle")}
        </h2>
        <p className="text-(--color-fixed-text) text-[14px] mb-[14px]">
          {t("donation.leaderboardSubtitle")}
        </p>

        {leaderboardItems.length > 0 && !leaderboardQuery.isLoading && (
          <div
            style={{ position: "relative", height: "90px", overflow: "hidden" }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                display: "flex",
                gap: "12px",
                animation:
                  leaderboardItems.length > 1
                    ? "marqueeScroll 28s linear infinite"
                    : "none",
              }}
            >
              {marqueeItems.map((item, index) => (
                <article
                  key={`${item.userId}-${index}`}
                  style={{ width: "260px", flexShrink: 0 }}
                  className="rounded-[12px] border border-(--stroke-soft) bg-(--color-input) p-[12px]"
                >
                  <div className="flex items-center justify-between gap-[10px]">
                    <div className="flex items-center gap-[10px]">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="h-[38px] w-[38px] rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-[38px] w-[38px] rounded-full border border-(--stroke-soft) flex items-center justify-center text-[12px] font-semibold text-(--color-fixed-text)">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-(--color-text) font-semibold text-[14px]">
                          {item.name}
                        </p>
                        <p className="text-(--color-fixed-text) text-[12px]">
                          {t("donation.totalDonated")}
                        </p>
                      </div>
                    </div>

                    <p className="text-(--color-hover) font-bold text-[15px] whitespace-nowrap">
                      {formatDonationAmount(
                        item.totalAmountMinor,
                        item.currency,
                      )}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
