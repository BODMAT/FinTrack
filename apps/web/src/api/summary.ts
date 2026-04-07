import {
  AllSummarySchema,
  ChartDataSchema,
  type IChartData,
  type ISummary,
  type Range,
} from "@fintrack/types";
import { handleRequest } from "@/utils/api";
import api from "./api";
import type { TransactionSource } from "@/types/monobank";

type SummaryOptions = {
  source?: TransactionSource;
};

export const getSummary = async (
  options?: SummaryOptions,
): Promise<ISummary> => {
  return handleRequest(
    api.get("/summary", {
      params: {
        ...(options?.source ? { source: options.source } : {}),
      },
    }),
    AllSummarySchema,
  );
};

export const getChartData = async (
  range: Range,
  options?: SummaryOptions,
): Promise<IChartData> => {
  return handleRequest(
    api.get("/summary/chart", {
      params: {
        range,
        ...(options?.source ? { source: options.source } : {}),
      },
    }),
    ChartDataSchema,
  );
};
