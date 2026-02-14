import { ENV } from "../../config/env.js";
import type { Request, Response, NextFunction } from "express";
import { OpenAI } from "openai";
import { AppError } from "../../middleware/errorHandler.js";

// Controllers
export async function ai(req: Request, res: Response, next: NextFunction) {
	try {
		const tokens = ENV.HF_API_TOKENS;
		if (tokens.length === 0) {
			throw new AppError(
				"No Hugging Face API tokens found in configuration",
				500,
			);
		}

		const DEFAULT_MODEL = "openai/gpt-oss-120b:cerebras";
		const { model, prompt, data } = req.body;
		const modelToUse = model ?? DEFAULT_MODEL;

		const errorMessages: string[] = [];

		for (const token of tokens) {
			const client = new OpenAI({
				baseURL: "https://router.huggingface.co/v1",
				apiKey: token,
			});

			try {
				const completion = await client.chat.completions.create({
					model: modelToUse,
					messages: [
						{
							role: "system",
							content: "You are a helpful assistant.",
						},
						{
							role: "user",
							content: `${prompt}\n\nData:\n${JSON.stringify(data)}`,
						},
					],
				});

				return res.json({
					model: completion.model,
					result: completion.choices[0]?.message.content,
				});
			} catch (err) {
				errorMessages.push(
					err instanceof Error ? err.message : String(err),
				);
			}
		}

		throw new AppError(
			`All tokens failed:\n${errorMessages.join("\n")}`,
			500,
		);
	} catch (err) {
		next(err);
	}
}
