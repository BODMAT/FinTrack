import { useQuery } from "@tanstack/react-query";
import type { IChartData, ISummary, Range } from "@fintrack/types";
import type { ApiError } from "../types/api";
import { getChartData, getSummary } from "../api/summary";
export const useSummary = (range: Range = "all") => {
  const summary = useQuery<ISummary, ApiError>({
    queryKey: ["transactions", "summary"],
    queryFn: getSummary,
    staleTime: 1000 * 60 * 5,
  });

  const chart = useQuery<IChartData, ApiError>({
    queryKey: ["transactions", "summary", "chart", range],
    queryFn: () => getChartData(range),
    enabled: !!range,
    staleTime: 1000 * 60 * 5,
  });

  return {
    summary: summary.data,
    chart: chart.data,
    isSummaryLoading: summary.isLoading,
    isChartLoading: chart.isLoading,
    isLoading: summary.isLoading || chart.isLoading,
    isError: summary.isError || chart.isError,
  };
};
