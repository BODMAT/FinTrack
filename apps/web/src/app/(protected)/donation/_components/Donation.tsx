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
import { DonationCards } from "./DonationCards";
import { DonationLeaderboard } from "./DonationLeaderboard";

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

      <DonationCards
        isCheckoutPending={checkoutMutation.isPending}
        onDonate={() => checkoutMutation.mutate()}
        tierLabel={tierLabel}
        isUnlimited={access?.isUnlimited ?? false}
        remainingAttempts={access?.remainingAttempts ?? 0}
        aiAnalysisLimit={access?.aiAnalysisLimit ?? 10}
      />

      <DonationLeaderboard
        items={leaderboardItems}
        isLoading={leaderboardQuery.isLoading}
      />
    </section>
  );
}
