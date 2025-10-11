import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
	statusCode: number;
	details?: any;

	constructor(message: string, statusCode: number = 400, details?: any) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
		Error.captureStackTrace?.(this, this.constructor);
	}
}

interface ErrorResponse {
	error: string;
	details?: any;
}

export function errorHandler(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
) {
	console.error(err instanceof Error ? err.stack : err);

	let statusCode: number = 500;
	let response: ErrorResponse = { error: "Internal Server Error" };

	if (err instanceof ZodError) {
		statusCode = 400;
		response = { error: "Validation failed", details: err.issues };
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		switch (err.code) {
			case "P2002": statusCode = 409; response = { error: "Item already exists", details: err.meta }; break;
			case "P2025": statusCode = 404; response = { error: "Not found", details: err.meta }; break;
		}
	} else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = 400;
		response = { error: "Invalid Prisma query", details: err.message };
	} else if (err instanceof AppError) {
		statusCode = err.statusCode;
		response = { error: err.message, details: err.details };
	}

	return res.status(statusCode).json(response);
}