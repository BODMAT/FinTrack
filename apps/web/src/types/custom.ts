import type { FC, SVGProps } from "react";

export interface IUser {
    nickname: string | null;
    password: string | null;

    userName: string | null;
    userPhoto: string | null;

    data: IData[] | null;
}

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
}

export interface Response {
    forPrompt: string;
    id: number;
    isNew: boolean;
    content: string;
    date: string;
}

export interface IProfileInfoState {
    nickname: string | null;
    password: string | null;
    submitted: boolean;
}