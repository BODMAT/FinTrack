export type CustomDate = "day" | "week" | "month" | "year" | "all";
export type MoneyType = "income" | "outcome" | "saving" | "balance";

export interface IData {
	// userId: string;
	id: string;

	title: string;
	type: "INCOME" | "EXPENSE";
	amount: string;
	created_at: string; //timestamp ex "2025-09-11T17:17:42.627Z"
	updated_at: string; //timestamp ex "2025-09-11T17:17:42.627Z"

	location?: {
		id: string;
		latitude: number;
		longitude: number;
	} | null;
}

//! Фактично для періоду
export interface IDataStatsPerRange {
	totalIncomePerRange: number;
	percentageIncomePerRange: number;

	totalOutcomePerRange: number;
	percentageOutcomePerRange: number;

	totalSavingPerRange: number;
	percentageSavingPerRange: number;
}

//! Фактично все - кожен стат та процент (3+3) * 5 видів таймлайнів
export interface IDataStats {
	currentBalance: number;

	dataStatsPerDay: IDataStatsPerRange;
	dataStatsPerWeek: IDataStatsPerRange;
	dataStatsPerMonth: IDataStatsPerRange;
	dataStatsPerYear: IDataStatsPerRange;
	dataStatsPerAllTime: IDataStatsPerRange;

	topTransaction: {
		maxPositiveTransaction: string;
		maxNegativeTransaction: string;
		minPositiveTransaction: string;
		minNegativeTransaction: string;
	};
}
