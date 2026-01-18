import axios from "axios";
import { z } from "zod";
import type { IData } from "../types/custom";

const AnalyzeResponseSchema = z.object({
	result: z.string(),
});

export async function analyzeData(
	data: IData[],
	prompt: string,
	model?: string,
): Promise<string> {
	const fullPrompt =
		"Проаналізуй промпт та дату та дай конкретну відповідь на запитання на тій мові яка буде далі в промпті (якщо англ — то на англ очікую відповідь). Ще не роби ніяких таблиць чи виділень тексту (жирним чи іншим) чи формул - відповідь коротким абзацом тексту. Дозволяються смайли, небагато. " +
		prompt;

	try {
		const response = await axios.post(
			"https://fintrack-irxy.onrender.com/api/analyze",
			{
				data,
				prompt: fullPrompt,
				model,
			},
		);

		const parsed = AnalyzeResponseSchema.safeParse(response.data);
		if (!parsed.success) {
			console.error("Validation error:", parsed.error);
			throw new Error("Invalid API response");
		}

		return parsed.data.result;
	} catch (error) {
		console.error("Analyze error:", error);
		throw error;
	}
}
