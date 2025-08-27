// import { Prisma } from "@prisma/client";
// import { prisma } from "../prisma/client.js";

// export async function getAllTransactions(userId: string = "") {
// 	return await prisma.transaction.findMany({
// 		where: {
// 			user: {
// 				id: userId,
// 			}
// 		}
// 	});
// }

// export async function getTransaction(transactionId: string) {
// 	return await prisma.transaction.findUnique({
// 		where: {
// 			id: transactionId,
// 		},
// 	});
// }

// export async function createTransaction(transaction: Prisma.TransactionCreateInput) {
// 	return prisma.transaction.create({
// 		data: transaction,
// 	});
// }

// export async function updateTransaction(transactionId: string, transaction: Prisma.TransactionUpdateInput) {
// 	return await prisma.transaction.update({
// 		where: {
// 			id: transactionId,
// 		},
// 		data: transaction,
// 	});
// }

// export async function deleteTransaction(transactionId: string) {
// 	return await prisma.transaction.delete({
// 		where: {
// 			id: transactionId,
// 		}
// 	});
// }
