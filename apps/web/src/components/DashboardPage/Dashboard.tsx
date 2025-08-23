import { DashboardCard } from "./DashboardCard";
import balance from "../../assets/dashboard/balance.svg?react";
import income from "../../assets/dashboard/income.svg?react";
import saving from "../../assets/dashboard/saving.svg?react";
import expenses from "../../assets/dashboard/expenses.svg?react";
import { IncomeOutcomeAnalitics } from "./IncomeOutcomeAnalitics";
import { IncomeOutcomeMap } from "./IncomeOutcomeMap";
import { CustomMessage } from "../Helpers";
import { useUser } from "../../hooks/useUser";
export function Dashboard() {
    const { user } = useUser();
    if (user.nickname === null) {
        return <CustomMessage message="You are not logged in. Please log in to see your dashboard." />
    }
    if (!user.data || user.data.length === 0) {
        return <CustomMessage message="You have no transactions. Please add some transactions to see your dashboard." />
    }
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
                <div className="flex-1/2 max-[1100px]:flex-1">
                    <IncomeOutcomeAnalitics />
                </div>
                <div className="flex-1/2 min-h-[450px] max-[1100px]:flex-1">
                    <IncomeOutcomeMap />
                </div>
            </div>
        </section>
    )
}