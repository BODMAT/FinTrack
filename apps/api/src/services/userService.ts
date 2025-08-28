import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export async function getAllUsers() {
	return await prisma.user.findMany();
}

export async function getUser(userId: string) {
	return await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});
}

export async function createUser(user: Prisma.UserCreateInput) {
	return prisma.user.create({
		data: user,
	});
}

export async function updateUser(userId: string, user: Prisma.UserUpdateInput) {
	return await prisma.user.update({
		where: {
			id: userId,
		},
		data: user,
	});
}

export async function deleteUser(userId: string) {
	return await prisma.user.delete({
		where: {
			id: userId,
		}
	});
}
