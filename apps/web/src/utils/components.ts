import type {
	ResponseTransaction,
	TransactionsListResponse,
} from "@fintrack/types";

export const getFilteredData = (
	data: TransactionsListResponse | undefined,
	searchQuery: string,
): TransactionsListResponse | undefined => {
	const query = searchQuery.trim().toLowerCase();
	if (!query || !data) return data;

	const words = query.split(/\s+/);

	const scoredData = data.data
		.map((item) => {
			const title = item.title.toLowerCase();
			const amount = item.amount.toString().toLowerCase();
			const type = (
				item.type === "INCOME" ? "income" : "outcome"
			).toLowerCase();

			let dateVariants: string[] = [];
			if (item.created_at) {
				const dateObj = new Date(item.created_at);
				dateVariants = [
					dateObj.toLocaleDateString("uk-UA"),
					dateObj.toLocaleDateString("en-GB"),
					dateObj.toLocaleTimeString("uk-UA", {
						hour: "2-digit",
						minute: "2-digit",
					}),
					dateObj.toDateString(),
				].map((d) => d.toLowerCase());
			}

			const matchesAllWords = words.every(
				(word) =>
					title.includes(word) ||
					amount.includes(word) ||
					type.includes(word) ||
					dateVariants.some((v) => v.includes(word)),
			);

			if (!matchesAllWords) return null;

			let score = 0;
			words.forEach((word) => {
				if (title.includes(word)) {
					score += 10;
					if (title.startsWith(word)) score += 5;
				}
				if (amount.includes(word)) score += 1;
				if (type.includes(word)) score += 1;
				if (dateVariants.some((v) => v.includes(word))) score += 1;
			});

			return { item, score };
		})
		.filter(
			(entry): entry is { item: ResponseTransaction; score: number } =>
				entry !== null,
		);

	if (scoredData.length === 0) return undefined;

	const finalData = scoredData
		.sort((a, b) => b.score - a.score)
		.map((entry) => entry.item);

	return { ...data, data: finalData };
};

export function toLocalDatetimeString(dateInput: Date, isPrettier = false) {
	const date = new Date(dateInput);
	const pad = (n: number) => n.toString().padStart(2, "0");

	if (isNaN(date.getTime())) return "Invalid Date";
	return (
		date.getFullYear() +
		"-" +
		pad(date.getMonth() + 1) +
		"-" +
		pad(date.getDate()) +
		`${isPrettier ? " " : "T"}` +
		pad(date.getHours()) +
		":" +
		pad(date.getMinutes())
	);
}

export function sanitizeAmountInput(raw: string): string {
	if (!raw) return "";
	let s = raw.replace(/[^\d.,]/g, "");
	s = s.replace(/,/g, ".");
	const parts = s.split(".");
	if (parts.length > 2) s = parts.shift() + "." + parts.join("");
	return s;
}

export function sanitizeText(text: string) {
	return String(text ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
