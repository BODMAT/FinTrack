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
      <h1 className="text-(--color-title) text-[32px] font-semibold mb-[27px]">
        {t("dashboard.title")}
      </h1>
      <div className="flex gap-[18px] flex-wrap mb-[24px]">
        <DashboardCard myImg={balance} title="balance" />
        <DashboardCard myImg={income} title="income" reversedPercentage />
        <DashboardCard myImg={saving} title="saving" />
        <DashboardCard myImg={expenses} title="outcome" reversedPercentage />
      </div>
      <div className="flex gap-[18px] max-[1100px]:flex-col">
        <div className="flex-1/2 max-[1100px]:flex-1">
          <IncomeOutcomeAnalitics />
        </div>
        <div className="flex-1/2 min-h-[450px] max-[1100px]:flex-1">
          <MapComponent />
        </div>
      </div>
    </section>
  );
}
