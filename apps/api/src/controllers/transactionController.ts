// import type { Request, Response, NextFunction } from "express";
// import { Prisma } from "@prisma/client";
// import { z } from "zod";
// import * as transactionService from "../services/transactionService.js";

// // Data validation
// const createTransactionSchema = z.object({
// 	tg_id: z.string().min(1),
// 	tg_nickname: z.string().min(1).max(50),
// 	name: z.string().min(1).max(50),
// 	photo_url: z.url().optional(),
// });

// const updateTransactionSchema = z.object({
// 	tg_nickname: z.string().min(1).max(50).optional(),
// 	name: z.string().min(1).max(50).optional(),
// 	photo_url: z.url().nullable().optional(),
// });

// // Controllers
// export async function getAllTransactions(req: Request, res: Response) {
// 	let transactions = [];
// 	const userId = req.query.user_id;
// 	if (userId) {
// 		transactions = await transactionService.getAllTransactions(String(userId));
// 	} else {
// 		transactions = await transactionService.getAllTransactions();
// 	}
// 	res.status(200).json(transactions);
// }

// export async function getTransaction(req: Request, res: Response, next: NextFunction) {
// 	try {
// 		const { id } = req.params;
// 		const user = await transactionService.getTransaction(String(id));
// 		if (!user) throw new Error("User not found");
// 		res.status(200).json(user);
// 	} catch (err) {
// 		next(err);
// 	}
// }

// export async function createTransaction(req: Request, res: Response, next: NextFunction) {
// 	try {
// 		const validatedBody = createTransactionSchema.parse(req.body);
// 		const prismaData = {
// 			...validatedBody,
// 			location: validatedBody.location ?? null
// 		};
// 		const user = await transactionService.createTransaction(prismaData);
// 		res.status(201).json(user);
// 	} catch (err) {
// 		next(err);
// 	}
// }

// export async function updateTransaction(req: Request, res: Response, next: NextFunction) {
// 	try {
// 		const { id } = req.params;
// 		const validatedBody = updateTransactionSchema.parse(req.body);

// 		const prismaData: Prisma.UserUpdateInput = {};
// 		if (validatedBody.tg_nickname !== undefined) prismaData.tg_nickname = validatedBody.tg_nickname;
// 		if (validatedBody.name !== undefined) prismaData.name = validatedBody.name;
// 		if (validatedBody.photo_url !== undefined) prismaData.photo_url = validatedBody.photo_url;

// 		const user = await transactionService.updateTransaction(String(id), prismaData);
// 		res.status(200).json(user);
// 	} catch (err) {
// 		next(err);
// 	}
// }

// export async function deleteTransaction(req: Request, res: Response, next: NextFunction) {
// 	try {
// 		const { id } = req.params;
// 		await transactionService.deleteTransaction(String(id));
// 		res.status(204).send();
// 	} catch (err) {
// 		next(err);
// 	}
// }

