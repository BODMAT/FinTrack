import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import * as userService from "./service.js";
import { AppError } from "../../middleware/errorHandler.js";

// Data validation
const createAuthMethodSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("EMAIL"),
		email: z.email().max(200),
		password: z.string().min(8),
	}),
	z.object({
		type: z.literal("TELEGRAM"),
		telegram_id: z.string().min(1),
	}),
]);

const updateAuthMethodSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("EMAIL"),
		email: z.email().max(200).optional(),
		password: z.string().min(8).optional(),
	}),
	z.object({
		type: z.literal("TELEGRAM"),
		telegram_id: z.string().min(1),
	}),
]);

const createUserSchema = z.object({
	name: z.string().min(1).max(200),
	photo_url: z.url().nullish(),
	created_at: z.coerce.date().optional(),
	updated_at: z.coerce.date().optional(),
	authMethods: z
		.array(createAuthMethodSchema)
		.min(1)
		.max(2)
		.refine(
			(methods) => {
				const types = methods.map((m) => m.type);
				return (
					types.filter((t) => t === "EMAIL").length <= 1 &&
					types.filter((t) => t === "TELEGRAM").length <= 1
				);
			},
			{
				message:
					"You can add a maximum of one EMAIL and one TELEGRAM authentication method",
			},
		),
});

const updateUserSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	photo_url: z.url().nullish(),
	created_at: z.coerce.date().optional(),
	updated_at: z.coerce.date().optional(),
	authMethods: z
		.array(updateAuthMethodSchema)
		.max(2)
		.refine(
			(methods) => {
				const types = methods.map((m) => m.type);
				return (
					types.filter((t) => t === "EMAIL").length <= 1 &&
					types.filter((t) => t === "TELEGRAM").length <= 1
				);
			},
			{
				message:
					"You can add a maximum of one EMAIL and one TELEGRAM authentication method",
			},
		)
		.optional(),
});

// Controllers
export async function getAllUsers(req: Request, res: Response) {
	const users = await userService.getAllUsers();
	res.status(200).json(users);
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;
		if (!id) throw new AppError("User ID is required");

		const user = await userService.getUser(id);
		if (!user) throw new AppError("Not found", 404);

		res.status(200).json(user);
	} catch (err) {
		next(err);
	}
}

export async function getCurrentUser(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const id = req.user?.id;
		if (!id) throw new AppError("Unauthorized", 401);

		const user = await userService.getUser(id);
		if (!user) throw new AppError("Not found", 404);

		res.status(200).json(user);
	} catch (err) {
		next(err);
	}
}

export async function createUser(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const validatedBody = createUserSchema.parse(req.body);
		const saltRounds = 10;

		const authMethodsWithHash = await Promise.all(
			validatedBody.authMethods.map(async (method) => {
				if (method.type === "EMAIL") {
					return {
						type: "EMAIL" as const,
						email: method.email,
						password_hash: await bcrypt.hash(
							method.password,
							saltRounds,
						),
						telegram_id: null,
					};
				}

				return {
					type: "TELEGRAM" as const,
					email: null,
					password_hash: null,
					telegram_id: method.telegram_id,
				};
			}),
		);

		const prismaData: Prisma.UserCreateInput = {
			name: validatedBody.name,
			photo_url: validatedBody.photo_url ?? null,
			...(validatedBody.created_at
				? { created_at: validatedBody.created_at }
				: {}),
			...(validatedBody.updated_at
				? { updated_at: validatedBody.updated_at }
				: {}),
			authMethods: {
				create: authMethodsWithHash,
			},
		};

		const user = await userService.createUser(prismaData);
		res.status(201).json(user);
	} catch (err) {
		next(err);
	}
}

export async function updateUser(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const { id } = req.params;
		if (!id) throw new AppError("User ID is required");

		const validatedBody = updateUserSchema.parse(req.body);

		const prismaData: Prisma.UserUpdateInput = {};
		if (validatedBody.name !== undefined)
			prismaData.name = validatedBody.name;
		if (validatedBody.photo_url !== undefined)
			prismaData.photo_url = validatedBody.photo_url;
		if (validatedBody.created_at !== undefined)
			prismaData.created_at = validatedBody.created_at;
		if (validatedBody.updated_at !== undefined)
			prismaData.updated_at = validatedBody.updated_at;

		const validatedAuthMethods: {
			type: "EMAIL" | "TELEGRAM";
			email?: string;
			password?: string;
			telegram_id?: string;
		}[] =
			validatedBody.authMethods?.map((m) => {
				if (m.type === "EMAIL") {
					return {
						type: "EMAIL" as const,
						...(m.email && { email: m.email }),
						...(m.password && { password: m.password }),
					};
				}
				return {
					type: "TELEGRAM" as const,
					telegram_id: m.telegram_id,
				};
			}) ?? [];

		await prisma.$transaction(async (tx) => {
			await userService.updateUser(tx, id, prismaData);

			if (validatedBody.authMethods) {
				await userService.updateUserAuthMethods(
					tx,
					id,
					validatedAuthMethods,
				);
			}
		});

		const updatedUser = await userService.getUser(id);
		res.status(200).json(updatedUser);
	} catch (err) {
		next(err);
	}
}

export async function updateCurrentUser(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const id = req.user?.id;
		if (!id) throw new AppError("Unauthorized", 401);

		const validatedBody = updateUserSchema.parse(req.body);

		const prismaData: Prisma.UserUpdateInput = {};
		if (validatedBody.name !== undefined)
			prismaData.name = validatedBody.name;
		if (validatedBody.photo_url !== undefined)
			prismaData.photo_url = validatedBody.photo_url;
		if (validatedBody.created_at !== undefined)
			prismaData.created_at = validatedBody.created_at;
		if (validatedBody.updated_at !== undefined)
			prismaData.updated_at = validatedBody.updated_at;

		const validatedAuthMethods: {
			type: "EMAIL" | "TELEGRAM";
			email?: string;
			password?: string;
			telegram_id?: string;
		}[] =
			validatedBody.authMethods?.map((m) => {
				if (m.type === "EMAIL") {
					return {
						type: "EMAIL" as const,
						...(m.email && { email: m.email }),
						...(m.password && { password: m.password }),
					};
				}
				return {
					type: "TELEGRAM" as const,
					telegram_id: m.telegram_id,
				};
			}) ?? [];

		await prisma.$transaction(async (tx) => {
			await userService.updateUser(tx, id, prismaData);

			if (validatedBody.authMethods) {
				await userService.updateUserAuthMethods(
					tx,
					id,
					validatedAuthMethods,
				);
			}
		});

		const updatedUser = await userService.getUser(id);
		res.status(200).json(updatedUser);
	} catch (err) {
		next(err);
	}
}

export async function deleteUser(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const { id } = req.params;
		if (!id) throw new AppError("User ID is required");

		await userService.deleteUser(id);
		res.sendStatus(204);
	} catch (err) {
		next(err);
	}
}

export async function deleteCurrentUser(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const id = req.user?.id;
		if (!id) throw new AppError("Unauthorized", 401);

		await userService.deleteUser(id);
		res.sendStatus(204);
	} catch (err) {
		next(err);
	}
}

export async function deleteAuthMethod(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const { userId, authMethodId } = req.params;
		if (!userId) throw new AppError("User ID is required");
		if (!authMethodId) throw new AppError("Auth Method ID is required");

		await userService.deleteAuthMethod(userId, authMethodId);
		res.sendStatus(204);
	} catch (err) {
		next(err);
	}
}

export async function deleteAuthMethodForCurrentUser(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = req.user?.id;
		const { authMethodId } = req.params;

		if (!userId) throw new AppError("Unauthorized", 401);
		if (!authMethodId) throw new AppError("Auth Method ID is required");

		await userService.deleteAuthMethod(userId, authMethodId);
		res.sendStatus(204);
	} catch (err) {
		next(err);
	}
}
