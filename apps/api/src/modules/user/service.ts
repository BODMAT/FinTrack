import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import type { PrismaTx } from "../../prisma/client.js";
import bcrypt from "bcrypt";
import { AppError } from "../../middleware/errorHandler.js";

export async function getAllUsers() {
	return await prisma.user.findMany({
		include: {
			authMethods: {
				omit: {
					password_hash: true,
					userId: true,
				},
			},
		},
	});
}

export async function getUser(userId: string) {
	return await prisma.user.findUnique({
		where: {
			id: userId,
		},
		include: {
			authMethods: {
				omit: {
					password_hash: true,
					userId: true,
				},
			},
		},
	});
}

export async function createUser(user: Prisma.UserCreateInput) {
	return await prisma.user.create({
		data: user,
		include: {
			authMethods: {
				omit: {
					password_hash: true,
					userId: true,
				},
			},
		},
	});
}

export async function updateUser(
	client: PrismaTx,
	userId: string,
	user: Prisma.UserUpdateInput,
) {
	return await client.user.update({
		where: {
			id: userId,
		},
		data: user,
		include: {
			authMethods: {
				omit: {
					password_hash: true,
					userId: true,
				},
			},
		},
	});
}

export async function updateUserAuthMethods(
	client: PrismaTx,
	userId: string,
	authMethods: {
		type: "EMAIL" | "TELEGRAM";
		email?: string;
		password?: string;
		telegram_id?: string;
	}[],
) {
	const saltRounds = 10;

	for (const method of authMethods) {
		if (method.type === "EMAIL") {
			const existing = await client.authMethod.findFirst({
				where: { userId, type: "EMAIL" },
			});

			if (existing) {
				const email = method.email ?? existing.email;
				const password_hash = method.password
					? await bcrypt.hash(method.password, saltRounds)
					: existing.password_hash;

				await client.authMethod.update({
					where: { id: existing.id },
					data: { email, password_hash },
				});
			} else {
				if (!method.email || !method.password) {
					throw new AppError(
						"To create EMAIL auth you must provide both email and password",
					);
				}

				const password_hash = await bcrypt.hash(
					method.password,
					saltRounds,
				);
				await client.authMethod.create({
					data: {
						type: "EMAIL",
						email: method.email,
						password_hash,
						user: { connect: { id: userId } },
					},
				});
			}
		} else if (method.type === "TELEGRAM" && method.telegram_id) {
			const existing = await client.authMethod.findFirst({
				where: { userId, type: "TELEGRAM" },
			});

			if (existing) {
				await client.authMethod.update({
					where: { id: existing.id },
					data: { telegram_id: method.telegram_id },
				});
			} else {
				await client.authMethod.create({
					data: {
						type: "TELEGRAM",
						telegram_id: method.telegram_id,
						user: { connect: { id: userId } },
					},
				});
			}
		}
	}
}

export async function deleteUser(userId: string) {
	return await prisma.user.delete({
		where: {
			id: userId,
		},
	});
}

export async function deleteAuthMethod(userId: string, authMethodId: string) {
	const count = await prisma.authMethod.count({ where: { userId } });
	if (count <= 1) {
		throw new AppError("You cannot remove the last authentication method");
	}

	return await prisma.authMethod.delete({
		where: {
			id: authMethodId,
		},
	});
}
