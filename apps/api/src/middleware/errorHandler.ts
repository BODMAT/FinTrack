import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function errorHandler(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
) {
	console.error(err);

	// Zod (валідація)
	if (err instanceof ZodError) {
		return res.status(400).json({ error: "Validation failed", details: err.issues });
	}

	// Prisma
	if (err instanceof Prisma.PrismaClientValidationError) {
		return res.status(400).json({ error: "Invalid Prisma query", details: err.message });
	}

	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") return res.status(409).json({ error: "Item already exists" });
		if (err.code === "P2025") return res.status(404).json({ error: "Not found" });
	}

	// Кастомні помилки
	if (err instanceof Error) {
		if (err.message === "user_id is required") {
			return res.status(400).json({ error: "user_id is required" });
		}
		if (err.message === "Invalid pagination params") {
			return res.status(400).json({ error: "Invalid pagination params" });
		}
		if (err.message === "Not found") {
			return res.status(404).json({ error: "Not Found" });
		}
		if (err.message.includes("No tokens found in HF_API_TOKEN")) {
			return res.status(500).json({ error: "Misconfiguration: missing HuggingFace tokens" });
		}
		if (err.message.includes("All tokens failed")) {
			return res.status(500).json({ error: err.message });
		}
	}

	// Fallback
	return res.status(500).json({ error: "Internal Server Error" });
}