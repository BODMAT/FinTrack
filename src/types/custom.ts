import type { FC, SVGProps } from "react";

export interface IData {
    id: number;

    title: string;
    amount: number;
    isIncome: boolean;
    date: string;

    location?: string;
}

export type CustomDate = "day" | "week" | "month" | "year" | "all";
export type MoneyType = "income" | "outcome" | "saving" | "balance";


export interface DashboardCardProps {
    myImg: string | FC<SVGProps<SVGSVGElement>>;
    title: MoneyType;
    reversedPercentage?: boolean;

    inPopup?: boolean;
    dataForPopupChart?: {
        income: number[];
        outcome: number[];
        labels: string[];
    };
}

export interface IDataForm extends Omit<IData, "amount"> {
    amount: string;
}