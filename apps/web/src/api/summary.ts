import {
	AllSummarySchema,
	ChartDataSchema,
	type IChartData,
	type ISummary,
	type Range,
} from "@fintrack/types";
import { handleRequest } from "../utils/api";
import api from "./api";

export const getSummary = async (): Promise<ISummary> => {
	return handleRequest(api.get("/summary"), AllSummarySchema);
};

export const getChartData = async (range: Range): Promise<IChartData> => {
	return handleRequest(
		api.get("/summary/chart", {
			params: { range },
		}),
		ChartDataSchema,
	);
};
