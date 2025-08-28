import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import * as userService from "../services/userService.js";

// Data validation
const createUserSchema = z.object({
	tg_id: z.string().min(1),
	tg_nickname: z.string().min(1).max(50),
	name: z.string().min(1).max(50),
	photo_url: z.url().optional(),
});

const updateUserSchema = z.object({
	tg_nickname: z.string().min(1).max(50).optional(),
	name: z.string().min(1).max(50).optional(),
	photo_url: z.url().nullable().optional(),
});

// Controllers
export async function getAllUsers(req: Request, res: Response) {
	const users = await userService.getAllUsers();
	res.status(200).json(users);
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;
		const user = await userService.getUser(String(id));
		if (!user) throw new Error("Not found");
		res.status(200).json(user);
	} catch (err) {
		next(err);
	}
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
	try {
		const validatedBody = createUserSchema.parse(req.body);
		const prismaData = {
			...validatedBody,
			photo_url: validatedBody.photo_url ?? null
		};
		const user = await userService.createUser(prismaData);
		res.status(201).json(user);
	} catch (err) {
		next(err);
	}
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;
		const validatedBody = updateUserSchema.parse(req.body);

		const prismaData: Prisma.UserUpdateInput = {};
		if (validatedBody.tg_nickname !== undefined) prismaData.tg_nickname = validatedBody.tg_nickname;
		if (validatedBody.name !== undefined) prismaData.name = validatedBody.name;
		if (validatedBody.photo_url !== undefined) prismaData.photo_url = validatedBody.photo_url;

		const user = await userService.updateUser(String(id), prismaData);
		res.status(200).json(user);
	} catch (err) {
		next(err);
	}
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;
		await userService.deleteUser(String(id));
		res.status(204).send();
	} catch (err) {
		next(err);
	}
}

