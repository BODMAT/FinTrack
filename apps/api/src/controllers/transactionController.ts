import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import * as transactionService from "../services/transactionService.js";

// Data validation
const createTransactionSchema = z.object({
	title: z.string().min(1).max(50),
	type: z.enum(["INCOME", "EXPENSE"]),
	amount: z.number().positive(),
	created_at: z.preprocess((arg) => arg ? new Date(arg as string) : undefined, z.date().optional()),
	location: z
		.object({
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180),
		})
		.optional(),
	userId: z.uuid(),
});

const updateTransactionSchema = z.object({
	title: z.string().min(1).max(50).optional(),
	type: z.enum(["INCOME", "EXPENSE"]).optional(),
	amount: z.number().positive().optional(),
	created_at: z.date().optional(),
	location: z
		.object({
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180),
		})
		.optional(),
});

// Controllers
export async function getAllTransactions(req: Request, res: Response, next: NextFunction) {
	try {
		const userId = typeof req.query.user_id === 'string' ? String(req.query.user_id) : undefined;
		if (!userId) throw new Error("user_id is required");

		const page = req.query.page ? Number(req.query.page) : 1;
		const perPage = req.query.perPage ? Number(req.query.perPage) : 10;
		if (Number.isNaN(page) || Number.isNaN(perPage)) throw new Error("Invalid pagination params");

		const transactions = await transactionService.getAllTransactions(userId, page, perPage);
		res.status(200).json(transactions);
	} catch (err) {
		next(err);
	}
}

export async function getTransaction(req: Request, res: Response, next: NextFunction) {
	try {
		let transaction: object | null = {};
		const { id } = req.params;
		const userId = req.query.user_id;
		if (userId) {
			transaction = await transactionService.getTransaction(String(id), String(userId));
		} else {
			transaction = await transactionService.getTransaction(String(id));
		}
		if (!transaction) throw new Error("Not found");
		res.status(200).json(transaction);
	} catch (err) {
		next(err);
	}
}

export async function createTransaction(req: Request, res: Response, next: NextFunction) {
	try {
		const validatedBody = createTransactionSchema.parse(req.body);

		const prismaData: Prisma.TransactionCreateInput = {
			title: validatedBody.title,
			type: validatedBody.type,
			amount: validatedBody.amount,
			...(validatedBody.created_at ? { created_at: validatedBody.created_at } : {}),
			user: {
				connect: { id: validatedBody.userId },
			},
			...(validatedBody.location && {
				location: {
					create: {
						latitude: validatedBody.location.latitude,
						longitude: validatedBody.location.longitude,
					}
				}
			})
		};
		const transaction = await transactionService.createTransaction(prismaData);
		res.status(201).json(transaction);
	} catch (err) {
		next(err);
	}
}

export async function updateTransaction(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;
		const validatedBody = updateTransactionSchema.parse(req.body);

		const prismaData: Prisma.TransactionUpdateInput = {};
		if (validatedBody.title !== undefined) prismaData.title = validatedBody.title;
		if (validatedBody.type !== undefined) prismaData.type = validatedBody.type;
		if (validatedBody.amount !== undefined) prismaData.amount = validatedBody.amount;
		if (validatedBody.created_at !== undefined) prismaData.created_at = validatedBody.created_at;
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
					}
				}
			};
		}

		const transaction = await transactionService.updateTransaction(String(id), prismaData);
		res.status(200).json(transaction);
	} catch (err) {
		next(err);
	}
}

export async function deleteTransaction(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;
		await transactionService.deleteTransaction(String(id));
		res.status(204).send();
	} catch (err) {
		next(err);
	}
}
