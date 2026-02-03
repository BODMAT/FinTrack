import type { Range, TransactionsListResponse } from "@fintrack/types";
import { simpleMemoize3 } from "./other";

export function groupData(
	data: TransactionsListResponse,
	range: Range,
	nowDate?: Date,
) {
	const now = nowDate || new Date();

	function getStartOfWeek(date: Date): Date {
		const day = date.getDay();
		const diff = day === 0 ? 6 : day - 1;
		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		start.setDate(date.getDate() - diff);
		return start;
	}

	const map = new Map<
		string,
		{ income: number; outcome: number; rawDate: Date }
	>();

	const filtered = data.data.filter((item) => {
		const date = item.created_at;

		if (!date) return false;

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
		if (!item.created_at) continue;

		const date = item.created_at;
		let key = "";
		let rawDate = new Date(date);

		if (range === "day") {
			const hour = date.getHours().toString().padStart(2, "0");
			key = `${hour}:00`;
			rawDate.setMinutes(0, 0, 0);
			rawDate.setHours(date.getHours());
		} else if (range === "week") {
			key = date.toLocaleDateString("default", {
				weekday: "short",
				day: "2-digit",
				month: "short",
			});
			rawDate.setHours(0, 0, 0, 0);
		} else if (range === "month") {
			const week = Math.ceil(date.getDate() / 7);
			key = `Week ${week} of ${date.toLocaleString("default", { month: "short" })}`;
			rawDate = new Date(
				date.getFullYear(),
				date.getMonth(),
				(week - 1) * 7 + 1,
			);
		} else if (range === "year") {
			key = date.toLocaleString("default", { month: "short" });
			rawDate = new Date(date.getFullYear(), date.getMonth(), 1);
		} else if (range === "all") {
			key = date.toLocaleString("default", {
				month: "short",
				year: "numeric",
			});
			rawDate = new Date(date.getFullYear(), date.getMonth(), 1);
		}

		const group = map.get(key) || { income: 0, outcome: 0, rawDate };
		if (item.type === "INCOME") group.income += Number(item.amount);
		else group.outcome += Number(item.amount);

		map.set(key, group);
	}

	const sortedEntries = Array.from(map.entries()).sort(
		(a, b) => a[1].rawDate.getTime() - b[1].rawDate.getTime(),
	);

	const labels = sortedEntries.map(([label]) => label);
	const income = sortedEntries.map(([, val]) => val.income);
	const outcome = sortedEntries.map(([, val]) => val.outcome);

	return { labels, income, outcome };
}

export function generateId(): string {
	const now = new Date().getTime();
	const random = Math.floor(Math.random() * 1000000);
	return `${now}_${random}`;
}

export const memoizedGroupData = simpleMemoize3(groupData);
