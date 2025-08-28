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

	if (err instanceof ZodError) {
		return res.status(400).json({ error: "Validation failed", details: err.issues });
	}

	if (err instanceof Prisma.PrismaClientValidationError) {
		return res.status(400).json({ error: "Invalid Prisma query", details: err.message });
	}

	if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
		return res.status(409).json({ error: "Item already exists" });
	}

	if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
		return res.status(404).json({ error: "Not found" });
	}

	if (err instanceof Error && err.message === "Not found") {
		return res.status(404).json({ error: "Not Found" });
	}

	return res.status(500).json({ error: "Internal Server Error" });
}