import z from "zod";

import {
	type Range,
	type MoneyType,
	type ISummary,
	SummaryPerRangeSchema,
} from "@fintrack/types";
import type { FC, SVGProps } from "react";

export const rangeToKeyMap = {
	day: "dataStatsPerDay",
	week: "dataStatsPerWeek",
	month: "dataStatsPerMonth",
	year: "dataStatsPerYear",
	all: "dataStatsPerAllTime",
} as const;

export const getStats = (
	summary: ISummary,
	period: Range,
): z.infer<typeof SummaryPerRangeSchema> => {
	const key = rangeToKeyMap[period];
	const stats = summary[key];
	if (typeof stats === "object") return stats;
	return summary.dataStatsPerWeek;
};

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
