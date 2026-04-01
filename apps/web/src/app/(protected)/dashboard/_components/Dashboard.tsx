import { DashboardCard } from "./DashboardCard";
import balance from "@/assets/dashboard/balance.svg?react";
import income from "@/assets/dashboard/income.svg?react";
import saving from "@/assets/dashboard/saving.svg?react";
import expenses from "@/assets/dashboard/expenses.svg?react";
import { IncomeOutcomeAnalitics } from "./IncomeOutcomeAnalitics";
import { CustomMessage, Spinner } from "@/shared/ui/Helpers";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionsAll } from "@/hooks/useTransactions";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface DashboardProps {
  MapComponent?: React.ComponentType;
}

function EmptyMapSlot() {
  return null;
}

export function Dashboard({ MapComponent = EmptyMapSlot }: DashboardProps) {
  const { t } = useSafeTranslation();
  const { user, isLoading } = useAuth();
  const { data: transactions } = useTransactionsAll({ userId: user?.id });

  if (isLoading) return <Spinner />;

  if (!user) {
    return <CustomMessage message={t("dashboard.notLoggedIn")} />;
  }

  if (!transactions || transactions.data.length === 0) {
    return <CustomMessage message={t("dashboard.noTransactions")} />;
  }

  return (
    <section className="w-full">
      <div className="neo-panel neo-panel-glow mb-[24px] px-[22px] py-[18px]">
        <div className="flex items-center justify-between gap-[12px] max-[700px]:flex-col max-[700px]:items-start">
          <div>
            <h1 className="text-(--color-title) text-[32px] font-semibold">
              {t("dashboard.title")}
            </h1>
            <p className="mt-[8px] text-(--color-fixed-text) text-[14px]">
              {t("dashboard.overview")}
            </p>
          </div>
          <span className="neo-chip">{t("dashboard.styleBadge")}</span>
        </div>
      </div>

      <div className="mb-[24px] grid grid-cols-4 gap-[18px] max-[1320px]:grid-cols-2 max-[720px]:grid-cols-1">
        <DashboardCard myImg={balance} title="balance" />
        <DashboardCard myImg={income} title="income" reversedPercentage />
        <DashboardCard myImg={saving} title="saving" />
        <DashboardCard myImg={expenses} title="outcome" reversedPercentage />
      </div>

      <div className="grid grid-cols-2 gap-[18px] max-[1100px]:grid-cols-1">
        <div className="min-h-[470px]">
          <IncomeOutcomeAnalitics />
        </div>
        <div className="min-h-[470px]">
          <MapComponent />
        </div>
      </div>
    </section>
  );
}
