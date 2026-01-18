import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import * as transactionService from "./service.js";
import { AppError } from "../../middleware/errorHandler.js";

// Data validation
const locationSchema = z.object({
	latitude: z.coerce.number().min(-90).max(90),
	longitude: z.coerce.number().min(-180).max(180),
});

const createTransactionSchema = z.object({
	title: z.string().min(1).max(50),
	type: z.enum(["INCOME", "EXPENSE"]),
	amount: z.coerce.number().positive(),
	created_at: z.coerce.date().optional(),
	updated_at: z.coerce.date().optional(),
	location: locationSchema.nullish(),
});

const updateTransactionSchema = z.object({
	title: z.string().min(1).max(50).optional(),
	type: z.enum(["INCOME", "EXPENSE"]).optional(),
	amount: z.coerce.number().positive().optional(),
	created_at: z.coerce.date().optional(),
	updated_at: z.coerce.date().optional(),
	location: locationSchema.nullish(),
});

// Controllers
export async function getAllTransactions(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = req.user?.id;
		if (!userId) throw new AppError("Unauthorized", 401);

		const hasPage = req.query.page !== undefined;
		const hasPerPage = req.query.perPage !== undefined;

		if (hasPage !== hasPerPage) {
			throw new AppError(
				"Both 'page' and 'perPage' are required for pagination",
			);
		}

		if (hasPage && hasPerPage) {
			const page = Number(req.query.page);
			const perPage = Number(req.query.perPage);
			if (
				Number.isNaN(page) ||
				Number.isNaN(perPage) ||
				page < 1 ||
				perPage < 1
			) {
				throw new AppError("Invalid pagination params");
			}
			const transactions =
				await transactionService.getTransactionsPerPage(
					userId,
					page,
					perPage,
				);
			res.status(200).json(transactions);
			return;
		}

		const transactions =
			await transactionService.getAllTransactions(userId);
		res.status(200).json(transactions);
	} catch (err) {
		next(err);
	}
}

export async function getTransaction(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		let transaction: object | null = {};
		const { id } = req.params;
		if (!id) throw new AppError("Transaction id is required");
		const userId = req.user?.id;
		if (!userId) throw new AppError("Unauthorized", 401);
		transaction = await transactionService.getTransaction(id, userId);
		if (!transaction) throw new AppError("Not found", 404);
		res.status(200).json(transaction);
	} catch (err) {
		next(err);
	}
}

export async function createTransaction(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const validatedBody = createTransactionSchema.parse(req.body);
		const userId = req.user?.id;
		if (!userId) throw new AppError("Unauthorized", 401);

		const prismaData: Prisma.TransactionCreateInput = {
			title: validatedBody.title,
			type: validatedBody.type,
			amount: validatedBody.amount,
			...(validatedBody.created_at
				? { created_at: validatedBody.created_at }
				: {}),
			...(validatedBody.updated_at
				? { updated_at: validatedBody.updated_at }
				: {}),
			user: {
				connect: { id: userId },
			},
			...(validatedBody.location && {
				location: {
					create: {
						latitude: validatedBody.location.latitude,
						longitude: validatedBody.location.longitude,
					},
				},
			}),
		};
		const transaction =
			await transactionService.createTransaction(prismaData);
		res.status(201).json(transaction);
	} catch (err) {
		next(err);
	}
}

export async function updateTransaction(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const { id } = req.params;
		if (!id) throw new AppError("Transaction id is required");
		const validatedBody = updateTransactionSchema.parse(req.body);

		const userId = req.user?.id;
		if (!userId) throw new AppError("Unauthorized", 401);

		const transactionOfCurrentUser =
			await transactionService.getTransaction(id, userId);
		if (!transactionOfCurrentUser) throw new AppError("Not found", 404);

		const prismaData: Prisma.TransactionUpdateInput = {};
		if (validatedBody.title !== undefined)
			prismaData.title = validatedBody.title;
		if (validatedBody.type !== undefined)
			prismaData.type = validatedBody.type;
		if (validatedBody.amount !== undefined)
			prismaData.amount = validatedBody.amount;
		if (validatedBody.created_at !== undefined)
			prismaData.created_at = validatedBody.created_at;
		if (validatedBody.updated_at !== undefined)
			prismaData.updated_at = validatedBody.updated_at;
		if (validatedBody.location) {
			prismaData.location = {
				upsert: {
					create: {
						latitude: validatedBody.location.latitude,
						longitude: validatedBody.location.longitude,
					},
					update: {
						latitude: validatedBody.location.latitude,
						longitude: validatedBody.location.longitude,
					},
				},
			};
		}
		if (validatedBody.location === null) {
			prismaData.location = { delete: true };
		}

		const transaction = await transactionService.updateTransaction(
			id,
			prismaData,
		);
		res.status(200).json(transaction);
	} catch (err) {
		next(err);
	}
}

export async function deleteTransaction(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const { id } = req.params;
		if (!id) throw new AppError("Transaction id is required");

		const userId = req.user?.id;
		if (!userId) throw new AppError("Unauthorized", 401);

		const transactionOfCurrentUser =
			await transactionService.getTransaction(id, userId);
		if (!transactionOfCurrentUser) throw new AppError("Not found", 404);

		await transactionService.deleteTransaction(id);
		res.sendStatus(204);
	} catch (err) {
		next(err);
	}
}
