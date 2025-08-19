import type { FC, SVGProps } from "react";

export interface IData {
    id: number;

    title: string;
    amount: number;
    isIncome: boolean;
    date: string;

    location?: {
        lat: number;
        lng: number;
    };
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

export interface IDataForm extends Omit<IData, "amount" | "location"> {
    amount: string;
    location?: {
        lat: string;
        lng: string;
    };
}


export interface AIState {
    prompt: string;
    response: Response[] | null;
    loading: boolean;

    setPrompt: (prompt: string) => void;
    setResponse: (newResponse: string, isNew?: boolean) => void;
    setLoading: (loading: boolean) => void;
    changeToOld: (id: number) => void;
}

interface Response {
    id: number;
    isNew: boolean;
    content: string;
    date: string;
}