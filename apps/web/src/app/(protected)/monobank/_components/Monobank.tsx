"use client";

import { useMemo, useState } from "react";
import Select from "react-select";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { Range } from "@fintrack/types";
import { useAuth } from "@/hooks/useAuth";
import {
  useMonobankMutations,
  useTransactionsAll,
} from "@/hooks/useTransactions";
import { usePopupStore } from "@/store/popup";
import type { MonobankPreviewTransaction } from "@/types/monobank";
import { CustomMessage } from "@/shared/ui/Helpers";
import { MonobankAccountSelectPopup } from "./MonobankAccountSelectPopup";
import { MonobankResultPopup } from "./MonobankResultPopup";
import { useMonobankCooldown } from "@/hooks/useMonobankCooldown";
import { useCurrency } from "@/hooks/useCurrency";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CHART_INCOME_COLOR = "#00c07a";
const CHART_OUTCOME_COLOR = "#ff4d5f";

type StatsTransaction = {
  id: string;
  title: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  currencyCode: string;
  createdAt: Date;
};

type ActionMode = "PREVIEW" | "IMPORT";

const rangeOptions: Array<{ value: Range; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All time" },
];

function extractErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return "Request failed.";
}

function getStartOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(date.getDate() - diff);
  return start;
}

function getPreviousDateByRange(range: Range): Date {
  const now = new Date();
  if (range === "day")
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (range === "week")
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  if (range === "month")
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  if (range === "year")
    return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return new Date(0);
}

function filterByRange(
  items: StatsTransaction[],
  range: Range,
  nowDate: Date = new Date(),
) {
  if (range === "all") return items;

  return items.filter((item) => {
    const date = item.createdAt;
    if (range === "day") return date.toDateString() === nowDate.toDateString();
    if (range === "week") {
      const start = getStartOfWeek(nowDate);
      return date >= start && date <= nowDate;
    }
    if (range === "month") {
      const start = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      return date >= start && date <= nowDate;
    }
    const start = new Date(nowDate.getFullYear(), 0, 1);
    return date >= start && date <= nowDate;
  });
}

function getTotals(items: StatsTransaction[]) {
  const income = items
    .filter((item) => item.type === "INCOME")
    .reduce((acc, item) => acc + item.amount, 0);
  const outcome = items
    .filter((item) => item.type === "EXPENSE")
    .reduce((acc, item) => acc + item.amount, 0);
  const saving = income - outcome;
  const balance = saving;

  return { income, outcome, saving, balance };
}

function getPercentage(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function buildChartData(items: StatsTransaction[], range: Range) {
  const map = new Map<
    string,
    { income: number; outcome: number; rawDate: Date }
  >();
  const now = new Date();
  const filtered = filterByRange(items, range, now);

  filtered.forEach((item) => {
    const date = new Date(item.createdAt);
    let key = "";
    let rawDate = new Date(date);

    if (range === "day") {
      key = `${date.getHours().toString().padStart(2, "0")}:00`;
      rawDate.setMinutes(0, 0, 0);
    } else if (range === "week") {
      key = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      rawDate.setHours(0, 0, 0, 0);
    } else if (range === "month") {
      const week = Math.ceil(date.getDate() / 7);
      key = `Week ${week}`;
      rawDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        (week - 1) * 7 + 1,
      );
    } else if (range === "year") {
      key = date.toLocaleString("en-GB", { month: "short" });
      rawDate = new Date(date.getFullYear(), date.getMonth(), 1);
    } else {
      key = date.toLocaleString("en-GB", { month: "short", year: "numeric" });
      rawDate = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    const group = map.get(key) || { income: 0, outcome: 0, rawDate };
    if (item.type === "INCOME") group.income += item.amount;
    else group.outcome += item.amount;
    map.set(key, group);
  });

  const sorted = Array.from(map.entries()).sort(
    (a, b) => a[1].rawDate.getTime() - b[1].rawDate.getTime(),
  );
  return {
    labels: sorted.map(([label]) => label),
    income: sorted.map(([, value]) => value.income),
    outcome: sorted.map(([, value]) => value.outcome),
  };
}

function getTransactionFingerprint(item: StatsTransaction) {
  return `${item.title}|${item.type}|${item.amount}|${item.currencyCode}|${item.createdAt.toISOString()}`;
}

function mergeUniqueTransactions(
  current: StatsTransaction[],
  incoming: StatsTransaction[],
) {
  const seen = new Set(current.map(getTransactionFingerprint));
  const merged = [...current];

  incoming.forEach((item) => {
    const fingerprint = getTransactionFingerprint(item);
    if (seen.has(fingerprint)) return;
    seen.add(fingerprint);
    merged.push(item);
  });

  return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function MonobankReadonlyTransactions({
  items,
}: {
  items: StatsTransaction[];
}) {
  const { t } = useSafeTranslation();
  const { displayCurrency, convertAmount, formatMoney } = useCurrency();
  if (items.length === 0) {
    return <CustomMessage message={t("monobank.noTransactionsYet")} />;
  }

  return (
    <div className="max-h-[480px] overflow-y-auto pr-[6px] [scrollbar-width:thin] [scrollbar-color:var(--color-hover)_var(--color-input)] [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:rounded-[999px] [&::-webkit-scrollbar-track]:bg-(--color-input) [&::-webkit-scrollbar-thumb]:rounded-[999px] [&::-webkit-scrollbar-thumb]:bg-(--color-hover)">
      <div className="flex flex-col gap-[12px]">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid min-h-[68px] grid-cols-4 items-center gap-[10px] rounded-[12px] border border-(--stroke-soft) p-[12px] text-(--color-text) max-[700px]:grid-cols-2"
          >
            <div className="truncate text-[15px]">{item.title}</div>
            <div className="font-semibold text-center">
              {formatMoney(
                convertAmount(item.amount, item.currencyCode, displayCurrency),
                displayCurrency,
              )}
            </div>
            <div className="text-center">
              <span
                className={`rounded-[10px] px-[10px] py-[4px] text-[12px] ${
                  item.type === "INCOME"
                    ? "bg-(--bg-green) text-(--text-green)"
                    : "bg-(--bg-red) text-(--text-red)"
                }`}
              >
                {item.type}
              </span>
            </div>
            <div className="text-center text-[13px] text-(--color-fixed-text)">
              {item.createdAt.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}{" "}
              {item.createdAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MonobankStats({ items }: { items: StatsTransaction[] }) {
  const { t } = useSafeTranslation();
  const { displayCurrency, convertAmount, formatMoney } = useCurrency();
  const [range, setRange] = useState<Range>("all");
  const convertedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        amount: convertAmount(item.amount, item.currencyCode, displayCurrency),
      })),
    [items, convertAmount, displayCurrency],
  );

  const current = useMemo(
    () => getTotals(filterByRange(convertedItems, range)),
    [convertedItems, range],
  );
  const overall = useMemo(() => getTotals(convertedItems), [convertedItems]);
  const previous = useMemo(
    () =>
      getTotals(
        filterByRange(convertedItems, range, getPreviousDateByRange(range)),
      ),
    [convertedItems, range],
  );
  const chart = useMemo(
    () => buildChartData(convertedItems, range),
    [convertedItems, range],
  );

  const statsCards = [
    {
      key: "balance",
      label: t("monobank.currentBalance"),
      total: overall.balance,
      percent: 0,
      reversed: false,
    },
    {
      key: "income",
      label: t("dashboard.card.income"),
      total: current.income,
      percent: getPercentage(current.income, previous.income),
      reversed: false,
    },
    {
      key: "saving",
      label: t("dashboard.card.saving"),
      total: current.saving,
      percent: getPercentage(current.saving, previous.saving),
      reversed: false,
    },
    {
      key: "outcome",
      label: t("dashboard.card.outcome"),
      total: current.outcome,
      percent: getPercentage(current.outcome, previous.outcome),
      reversed: true,
    },
  ];

  return (
    <div className="space-y-[16px]">
      <div className="grid grid-cols-2 gap-[12px] max-[520px]:grid-cols-1">
        {statsCards.map((card) => (
          <article key={card.key} className="neo-panel p-[14px]">
            <h3 className="text-(--color-fixed-text) text-[13px]">
              {card.label}
            </h3>
            <div className="mt-[8px] flex items-center justify-between">
              <strong className="text-(--color-text) text-[24px]">
                {formatMoney(card.total, displayCurrency)}
              </strong>
              {range !== "all" &&
                card.key !== "balance" &&
                card.percent !== null && (
                  <span
                    className={`rounded-[10px] px-[8px] py-[4px] text-[12px] ${
                      card.reversed
                        ? card.percent <= 0
                          ? "bg-(--bg-green) text-(--text-green)"
                          : "bg-(--bg-red) text-(--text-red)"
                        : card.percent >= 0
                          ? "bg-(--bg-green) text-(--text-green)"
                          : "bg-(--bg-red) text-(--text-red)"
                    }`}
                  >
                    {card.percent > 0 ? "+" : ""}
                    {card.percent}%
                  </span>
                )}
            </div>
          </article>
        ))}
      </div>

      <section className="neo-panel p-[16px]">
        <div className="mb-[12px] flex items-center justify-between gap-[12px] max-[560px]:flex-col max-[560px]:items-start">
          <h3 className="text-(--color-text) text-[20px] font-semibold">
            {t("monobank.analyticsTitle")}
          </h3>
          <Select
            options={rangeOptions}
            value={rangeOptions.find((option) => option.value === range)}
            onChange={(value) => setRange(value?.value ?? "all")}
            isClearable={false}
            menuPlacement="auto"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "var(--color-input)",
                borderColor: "var(--stroke-soft)",
                borderRadius: "10px",
                minWidth: 160,
                boxShadow: "none",
              }),
              singleValue: (base) => ({
                ...base,
                color: "var(--color-text)",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused
                  ? "var(--color-hover-reverse)"
                  : "var(--color-input)",
                color: state.isFocused
                  ? "var(--color-hover)"
                  : "var(--color-text)",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--stroke-soft)",
              }),
            }}
          />
        </div>

        <div className="h-[320px] min-w-[260px]">
          <Bar
            data={{
              labels: chart.labels,
              datasets: [
                {
                  label: t("dashboard.card.income"),
                  data: chart.income,
                  backgroundColor: CHART_INCOME_COLOR,
                  borderRadius: 6,
                },
                {
                  label: t("dashboard.card.outcome"),
                  data: chart.outcome,
                  backgroundColor: CHART_OUTCOME_COLOR,
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}

export function Monobank() {
  const { t } = useSafeTranslation();
  const { user } = useAuth();
  const { open, close } = usePopupStore();
  const {
    fetchMonobankAccountsData,
    isFetchingMonobankAccounts,
    fetchMonobankData,
    importMonobankData,
    deleteMonobankData,
    isDeletingMonobankData,
    fetchMonobankError,
    importMonobankError,
    deleteMonobankError,
  } = useMonobankMutations();
  const { data: savedMonobankData } = useTransactionsAll({
    userId: user?.id,
    source: "MONOBANK",
  });
  const { isCooldownActive, remainingSeconds, startCooldown } =
    useMonobankCooldown();

  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [previewTransactions, setPreviewTransactions] = useState<
    StatsTransaction[]
  >([]);

  const transactions = useMemo<StatsTransaction[]>(() => {
    if (previewTransactions.length > 0) return previewTransactions;

    return (savedMonobankData?.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      amount: Number(item.amount),
      currencyCode: item.currencyCode ?? "USD",
      createdAt: item.created_at ? new Date(item.created_at) : new Date(0),
    }));
  }, [previewTransactions, savedMonobankData]);

  const openResultPopup = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    open(
      title,
      <MonobankResultPopup type={type} title={title} message={message} />,
    );
  };

  const runAfterAccountSelection = async (params: {
    token: string;
    accountId: string;
    accountCurrencyCode?: number;
    mode: ActionMode;
  }) => {
    const now = Math.floor(Date.now() / 1000);
    const from = now - (2_682_000 - 3600);

    try {
      const statement = await fetchMonobankData({
        token: params.token,
        accountId: params.accountId,
        accountCurrencyCode: params.accountCurrencyCode,
        from,
        to: now,
      });

      const mappedPreview = statement.transactions.map(
        (item: MonobankPreviewTransaction) => ({
          id: item.sourceTransactionId,
          title: item.title,
          type: item.type,
          amount: item.amount,
          currencyCode: item.currencyCode,
          createdAt: new Date(item.created_at),
        }),
      );

      if (params.mode === "IMPORT") {
        const importResult = await importMonobankData({
          transactions: statement.transactions,
        });
        setPreviewTransactions((current) => {
          const base = current.length > 0 ? current : transactions;
          return mergeUniqueTransactions(base, mappedPreview);
        });
        openResultPopup(
          "success",
          t("monobank.importCompleted"),
          t("monobank.importCompletedMessage", {
            loaded: statement.transactions.length,
            imported: importResult.imported,
            skipped: importResult.skipped,
          }),
        );
        return;
      }

      setPreviewTransactions(mappedPreview);
      openResultPopup(
        "success",
        t("monobank.previewReady"),
        t("monobank.previewReadyMessage", {
          loaded: statement.transactions.length,
        }),
      );
    } catch (error) {
      const message =
        extractErrorMessage(error) ||
        importMonobankError ||
        fetchMonobankError ||
        "Operation failed.";
      openResultPopup("error", t("monobank.requestFailed"), message);
      throw new Error(message);
    }
  };

  const handleFetchAccounts = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedToken = token.trim();

    if (trimmedToken.length < 20) {
      setTokenError(t("monobank.tokenInvalid"));
      return;
    }

    setTokenError("");

    if (isCooldownActive) {
      setTokenError(
        t("monobank.waitBeforeRequest", { seconds: remainingSeconds }),
      );
      return;
    }

    try {
      startCooldown(60);
      const response = await fetchMonobankAccountsData({ token: trimmedToken });

      open(
        t("monobank.selectAccountTitle"),
        <MonobankAccountSelectPopup
          accounts={response.accounts}
          onContinue={async ({ accountId, accountCurrencyCode, mode }) => {
            close();
            await runAfterAccountSelection({
              token: trimmedToken,
              accountId,
              accountCurrencyCode,
              mode,
            });
          }}
        />,
      );
    } catch (error) {
      openResultPopup(
        "error",
        t("monobank.tokenCheckFailed"),
        extractErrorMessage(error),
      );
    }
  };

  const handleDeleteMonobankData = async () => {
    try {
      const result = await deleteMonobankData();
      setPreviewTransactions([]);
      openResultPopup(
        "success",
        t("monobank.dataRemoved"),
        t("monobank.removedMessage", { deleted: result.deleted }),
      );
    } catch (error) {
      openResultPopup(
        "error",
        t("monobank.deleteFailed"),
        extractErrorMessage(error) || deleteMonobankError || "Delete failed.",
      );
    }
  };

  if (!user) {
    return <CustomMessage message="Please login to use Monobank API." />;
  }

  return (
    <section className="w-full space-y-[20px]">
      <div className="neo-panel neo-panel-glow p-[20px]">
        <h1 className="text-(--color-title) text-[30px] font-semibold">
          {t("monobank.title")}
        </h1>
        <p className="mt-[8px] text-(--color-fixed-text) text-[15px]">
          {t("monobank.safeInfo")}
        </p>
        <ul className="mt-[14px] list-disc space-y-[6px] pl-[20px] text-(--color-fixed-text) text-[14px]">
          <li>{t("monobank.rangeLimit")}</li>
          <li>{t("monobank.cooldownLimit")}</li>
          <li>
            {t("monobank.getTokenAt")}{" "}
            <a
              href="https://api.monobank.ua/"
              target="_blank"
              rel="noreferrer"
              className="text-(--color-hover) underline"
            >
              api.monobank.ua
            </a>
            .
          </li>
        </ul>
      </div>

      <form
        onSubmit={handleFetchAccounts}
        className="neo-panel p-[18px] flex flex-col gap-[12px]"
      >
        <label className="text-(--color-text) text-[15px] font-semibold">
          {t("monobank.tokenLabel")}
        </label>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          type="password"
          placeholder="u3AulkpZFI1lIuGs..."
          className="rounded-[10px] border border-(--stroke-soft) bg-(--color-input) p-[12px] text-(--color-text) outline-none focus:border-(--color-hover)"
        />
        {tokenError && (
          <p className="text-(--text-red) text-[13px] font-medium">
            {tokenError}
          </p>
        )}
        <div className="flex items-center gap-[10px] max-[520px]:flex-col max-[520px]:items-start">
          <button
            type="submit"
            disabled={isFetchingMonobankAccounts || isCooldownActive}
            className="bg-(--color-card) rounded-[10px] px-[16px] py-[10px] text-(--color-text) border border-(--color-fixed-text) transitioned not-disabled:cursor-pointer not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover)"
          >
            {isFetchingMonobankAccounts
              ? t("monobank.checkingToken")
              : isCooldownActive
                ? `${remainingSeconds}s`
                : t("monobank.submitRequest")}
          </button>
          <span className="text-(--color-fixed-text) text-[13px]">
            {isCooldownActive
              ? t("monobank.cooldownLimit")
              : t("monobank.nextStep")}
          </span>
        </div>
      </form>

      <div className="neo-panel p-[16px]">
        <div className="flex items-center justify-between gap-[10px] max-[600px]:flex-col max-[600px]:items-start">
          <div>
            <h3 className="text-(--color-text) text-[18px] font-semibold">
              {t("monobank.storageTitle")}
            </h3>
            <p className="text-(--color-fixed-text) text-[13px]">
              {t("monobank.storageDesc")}
            </p>
          </div>
          <button
            onClick={handleDeleteMonobankData}
            disabled={isDeletingMonobankData}
            className="rounded-[10px] border border-(--text-red) bg-(--bg-red) px-[14px] py-[9px] text-[14px] font-semibold text-(--text-red) transitioned not-disabled:cursor-pointer not-disabled:hover:opacity-85"
          >
            {isDeletingMonobankData
              ? t("monobank.deleting")
              : t("monobank.deleteMyData")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[18px] max-[1180px]:grid-cols-1">
        <section className="neo-panel p-[16px]">
          <h2 className="mb-[12px] text-(--color-text) text-[24px] font-semibold">
            {t("monobank.transactionsTitle")}
          </h2>
          <p className="mb-[12px] text-(--color-fixed-text) text-[13px]">
            {t("monobank.readonlyDesc")}
          </p>
          <MonobankReadonlyTransactions items={transactions} />
        </section>

        <section>
          <MonobankStats items={transactions} />
        </section>
      </div>
    </section>
  );
}
