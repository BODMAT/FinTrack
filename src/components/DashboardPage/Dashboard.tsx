import { DashboardCard } from "./DashboardCard";
import balance from "../../assets/dashboard/balance.svg?react";
import income from "../../assets/dashboard/income.svg?react";
import saving from "../../assets/dashboard/saving.svg?react";
import expenses from "../../assets/dashboard/expenses.svg?react";
import { IncomeOutcomeAnalitics } from "./IncomeOutcomeAnalitics";
import { IncomeOutcomeMap } from "./IncomeOutcomeMap";
export function Dashboard() {
    return (
        <section className="w-full">
            <h1 className="text-[var(--color-title)] text-[32px] font-semibold mb-[27px]">Dashboard</h1>
            <div className="flex gap-[18px] flex-wrap mb-[24px]">
                <DashboardCard myImg={balance} title="balance" />
                <DashboardCard myImg={income} title="income" reversedPercentage />
                <DashboardCard myImg={saving} title="saving" />
                <DashboardCard myImg={expenses} title="outcome" reversedPercentage />
            </div>
            <div className="flex gap-[18px] max-[1100px]:flex-col">
                <div className="flex-2/3 max-[1100px]:flex-1">
                    <IncomeOutcomeAnalitics />
                </div>
                <div className="flex-1/3 max-[1100px]:flex-1">
                    <IncomeOutcomeMap />
                </div>
            </div>
        </section>
    )
}