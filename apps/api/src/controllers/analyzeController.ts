import type { Request, Response, NextFunction } from "express";
import { OpenAI } from "openai";

// Controllers
export async function analyze(req: Request, res: Response, next: NextFunction) {
	try {
		const tokens = Object.keys(process.env)
			.filter(key => key.startsWith("HF_API_TOKEN"))
			.map(key => process.env[key])
			.filter(Boolean);

		if (tokens.length === 0) {
			throw new Error("No tokens found in HF_API_TOKEN .env");
		}

		const DEFAULT_MODEL = "openai/gpt-oss-120b";
		const { model, prompt, data } = req.body;
		const modelToUse = model ?? DEFAULT_MODEL;

		let errorMessages: string[] = [];

		for (const token of tokens) {
			const client = new OpenAI({
				baseURL: "https://router.huggingface.co/v1",
				apiKey: token,
			});

			try {
				const completion = await client.chat.completions.create({
					model: modelToUse,
					messages: [
						{ role: "system", content: "You are a helpful assistant." },
						{ role: "user", content: `${prompt}\n\nData:\n${JSON.stringify(data)}` }
					]
				});

				return res.json({
					model: completion.model,
					result: completion.choices[0]?.message.content
				});
			} catch (err) {
				errorMessages.push(err instanceof Error ? err.message : String(err));
			}
		}

		throw new Error(`All tokens failed:\n${errorMessages.join("\n")}`);
	} catch (err) {
		next(err);
	}
}