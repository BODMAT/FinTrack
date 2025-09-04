import type { IData } from "../types/custom";

export const getFilteredData = (data: IData[] | undefined, searchQuery: string): IData[] | undefined => {
    searchQuery = searchQuery.trim().toLowerCase();
    if (!searchQuery) return data;

    const words = searchQuery.split(/\s+/);

    return data?.filter(item => {
        const dateObj = new Date(item.created_at);
        const dateVariants = [
            dateObj.toLocaleDateString("uk-UA"),
            dateObj.toLocaleDateString("en-GB"),
            dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            dateObj.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
            dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
            item.created_at
        ].map(str => str.toLowerCase());

        const title = item.title.toLowerCase();
        const sum = item.amount.toString().toLowerCase();
        const type = (item.type === "INCOME" ? "income" : "outcome").toLowerCase();

        return words.every(word =>
            title.includes(word) ||
            sum.includes(word) ||
            type.includes(word) ||
            dateVariants.some(dateVariant => dateVariant.includes(word))
        );
    });
};

export function toLocalDatetimeString(date: Date, isPrettier = false) {
    const pad = (n: number) => n.toString().padStart(2, "0");

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