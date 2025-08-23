import type { IData } from "../types/custom";

export async function analyzeData(data: IData[], prompt: string, model?: string): Promise<string> {
    prompt = "Проаналізуй промпт та дату та дай конкретну відповідь на запитання на тій мові яка буде далі в промпті (якщо ангд то на англ очікую відповідь). Ще не роби ніяких таблиць чи виділень тексту (жирним чи іншим) чи формул - відповідь коротким абзацом тексту. Дозволяються смайли, небагато." + prompt;
    try {
        const response = await fetch("https://fintrack-4izg.onrender.com/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data, prompt, model }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const json = await response.json();
        return json.result || "No response content";;
    } catch (error) {
        console.error("Analyze error:", error);
        throw error;
    }
}
