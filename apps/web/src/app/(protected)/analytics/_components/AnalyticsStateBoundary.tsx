import type { ReactNode } from "react";
import type { UserResponse, TransactionsListResponse } from "@fintrack/types";
import { CustomMessage, NoData, Spinner } from "@/shared/ui/Helpers";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface AnalyticsStateBoundaryProps {
  isAuthLoading: boolean;
  isTransactionsLoading: boolean;
  user?: UserResponse;
  transactionsError: boolean;
  transactionData?: TransactionsListResponse;
  children: ReactNode;
}

export function AnalyticsStateBoundary({
  isAuthLoading,
  isTransactionsLoading,
  user,
  transactionsError,
  transactionData,
  children,
}: AnalyticsStateBoundaryProps) {
  const { t } = useSafeTranslation();

  if (isAuthLoading || isTransactionsLoading) return <Spinner />;
  if (!user) return <CustomMessage message={t("analytics.notLoggedIn")} />;
  if (transactionsError)
    return <CustomMessage message={t("common.unexpected")} />;
  if (!transactionData) return <NoData />;

  return <>{children}</>;
}
