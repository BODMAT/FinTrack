import type { FC, SVGProps } from "react";
import type { IDataStats } from "../utils/stats";

export interface IUser {
    nickname: string | null;
    password: string | null;

    userName: string | null;
    userPhoto: string | null;

    data: IData[] | null;

    stats: IDataStats;
}

export interface IData {
    userId: string;
    id: string;

    title: string;
    amount: string;
    type: "INCOME" | "EXPENSE";
    created_at: string; //timestamp ex "2025-09-11T17:17:42.627Z"

    location?: {
        latitude: number;
        longitude: number;
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
        latitude: string;
        longitude: string;
    };
}


export interface AIState {
    prompt: string;
    response: Response[] | null;
}

export interface Response {
    forPrompt: string;
    id: string;
    isNew: boolean;
    content: string;
    date: string;
}

export interface IProfileInfoState {
    nickname: string | null;
    password: string | null;
    submitted: boolean;
}

export interface IErrorState {
    date: string | null;
    lat: string | null;
    lng: string | null;
}