import { useMemo } from "react";
import type { IChartData, ISummary, Range } from "@fintrack/types";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionsAll } from "@/hooks/useTransactions";
import { useCurrency } from "@/hooks/useCurrency";
import type { TransactionSource } from "@/types/monobank";
import { buildChartData, buildSummary } from "@/utils/summary.helpers";

type SummarySourceOptions = {
  source?: TransactionSource;
};

export const useSummary = (
  range: Range = "all",
  options?: SummarySourceOptions,
) => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useTransactionsAll({
    userId: user?.id,
    source: options?.source,
  });
  const { displayCurrency, convertAmount, isRatesLoading, isRatesError } =
    useCurrency();

  const convertedTransactions = useMemo(() => {
    return (data?.data ?? []).map((tx) => ({
      ...tx,
      amount: convertAmount(
        Number(tx.amount),
        tx.currencyCode ?? "USD",
        displayCurrency,
      ),
      created_at: tx.created_at ? new Date(tx.created_at) : undefined,
    }));
  }, [data, convertAmount, displayCurrency]);

  const summary = useMemo<ISummary | undefined>(() => {
    if (!convertedTransactions.length) return undefined;
    return buildSummary(convertedTransactions);
  }, [convertedTransactions]);

  const chart = useMemo<IChartData | undefined>(() => {
    if (!convertedTransactions.length) return undefined;
    return buildChartData(convertedTransactions, range);
  }, [convertedTransactions, range]);

  return {
    summary,
    chart,
    isSummaryLoading: isLoading || isRatesLoading,
    isChartLoading: isLoading || isRatesLoading,
    isLoading: isLoading || isRatesLoading,
    isError: isError || isRatesError,
  };
};
