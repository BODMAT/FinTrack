import type { CustomDate, IData, MoneyType } from "../types/custom";
import { simpleMemoize3 } from "./other";

export function groupData(data: IData[], range: CustomDate, nowDate?: Date) {
    const now = nowDate || new Date();

    function getStartOfWeek(date: Date): Date {
        const day = date.getDay();
        const diff = (day === 0 ? 6 : day - 1);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        start.setDate(date.getDate() - diff);
        return start;
    }

    const map = new Map<string, { income: number, outcome: number; rawDate: Date }>();

    const filtered = data.filter((item) => {
        const date = new Date(item.date);

        if (range === "day") {
            return date.toDateString() === now.toDateString();
        }

        if (range === "week") {
            const startOfWeek = getStartOfWeek(now);
            return date >= startOfWeek && date <= now;
        }

        if (range === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return date >= startOfMonth && date <= now;
        }

        if (range === "year") {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            return date >= startOfYear && date <= now;
        }

        if (range === "all") {
            return true;
        }

        return false;
    });


    for (const item of filtered) {
        const date = new Date(item.date);
        let key = "";
        let rawDate = new Date(date);

        if (range === "day") {
            const hour = date.getHours().toString().padStart(2, "0");
            key = `${hour}:00`;
            rawDate.setMinutes(0, 0, 0);
            rawDate.setHours(date.getHours());
        } else if (range === "week") {
            key = date.toLocaleDateString("default", { weekday: "short", day: "2-digit", month: "short" });
            rawDate.setHours(0, 0, 0, 0);
        } else if (range === "month") {
            const week = Math.ceil(date.getDate() / 7);
            key = `Week ${week} of ${date.toLocaleString("default", { month: "short" })}`;
            rawDate = new Date(date.getFullYear(), date.getMonth(), (week - 1) * 7 + 1);
        } else if (range === "year") {
            key = date.toLocaleString("default", { month: "short" });
            rawDate = new Date(date.getFullYear(), date.getMonth(), 1);
        } else if (range === "all") {
            key = date.toLocaleString("default", { month: "short", year: "numeric" });
            rawDate = new Date(date.getFullYear(), date.getMonth(), 1);
        }

        const group = map.get(key) || { income: 0, outcome: 0, rawDate };
        if (item.isIncome) group.income += item.amount;
        else group.outcome += item.amount;

        map.set(key, group);
    }

    const sortedEntries = Array.from(map.entries()).sort((a, b) => a[1].rawDate.getTime() - b[1].rawDate.getTime());

    const labels = sortedEntries.map(([label]) => label);
    const income = sortedEntries.map(([_, val]) => val.income);
    const outcome = sortedEntries.map(([_, val]) => val.outcome);

    return { labels, income, outcome };
}

export function getTotalOfRange(data: IData[], range: CustomDate, title: MoneyType, nowDate?: Date): number {
    if (title === "balance") {
        const totalIncome = data.filter((item) => item.isIncome).reduce((acc, cur) => acc + cur.amount, 0);
        const totalOutcome = data.filter((item) => !item.isIncome).reduce((acc, cur) => acc + cur.amount, 0);
        return totalIncome - totalOutcome;
    }

    const { income, outcome } = groupData(data, range, nowDate);

    if (title === "income") return income.reduce((acc, cur) => acc + cur, 0);
    if (title === "outcome") return outcome.reduce((acc, cur) => acc + cur, 0);
    if (title === "saving") return income.reduce((acc, cur) => acc + cur, 0) - outcome.reduce((acc, cur) => acc + cur, 0);

    return 0;
}

export function getPreviousDateByRange(range: CustomDate): Date {
    const now = new Date();
    let prevDate: Date;

    switch (range) {
        case "day":
            prevDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            break;
        case "week":
            prevDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
        case "month":
            prevDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        case "year":
            prevDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        case "all":
            prevDate = new Date(0);
            break;
        default:
            prevDate = now;
            break;
    }

    // console.log("Now:", now.toString());
    // console.log(`Previous date for range "${range}":`, prevDate.toString());

    return prevDate;
}

export function getPercentageOfRangeIncrease(
    data: IData[],
    range: CustomDate,
    title: MoneyType
): number {
    const currentTotal = getTotalOfRange(data, range, title);
    const previousTotal = getTotalOfRange(data, range, title, getPreviousDateByRange(range));

    if (previousTotal === 0) {
        if (currentTotal === 0) return 0;
        return 100;
    }

    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
}

export function generateId(): number {
    const now = new Date().getTime();
    const random = Math.floor(Math.random() * 1000000);
    return random + now;
}

const memoizedGroupData = simpleMemoize3(groupData);
const memoizedGetTotalOfRange = simpleMemoize3(getTotalOfRange);
const memoizedGetPercentage = simpleMemoize3(getPercentageOfRangeIncrease);

export function getUserDataWithStats(data: IData[], range: CustomDate, title: MoneyType) {
    const currentRangeForChart = memoizedGroupData(data, range);
    const total = memoizedGetTotalOfRange(data, range, title);
    const percentage = memoizedGetPercentage(data, range, title);
    const balance = memoizedGetTotalOfRange(data, range, "balance");

    const maxPositiveTransaction = data
        .filter((item) => item.isIncome)
        .sort((a, b) => b.amount - a.amount)[0]?.amount || 0;
    const maxNegativeTransaction = data
        .filter((item) => !item.isIncome)
        .sort((a, b) => b.amount - a.amount)[0]?.amount || 0;

    const minPositiveTransaction = data
        .filter((item) => item.isIncome)
        .sort((a, b) => a.amount - b.amount)[0]?.amount || 0;
    const minNegativeTransaction = data
        .filter((item) => !item.isIncome)
        .sort((a, b) => a.amount - b.amount)[0]?.amount || 0;

    return {
        currentRangeForChart,
        total,
        percentage,
        balance,
        maxPositiveTransaction,
        maxNegativeTransaction,
        minPositiveTransaction,
        minNegativeTransaction
    };
}