import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

export async function getAllTransactions(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    omit: { userId: true },
    include: {
      location: {
        omit: {
          transactionId: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return {
    data: transactions,
  };
}

export async function getTransactionsPerPage(
  userId: string,
  page: number,
  perPage: number,
) {
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      skip: (page - 1) * perPage,
      take: perPage,
      omit: { userId: true },
      include: {
        location: {
          omit: {
            transactionId: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return {
    data: transactions,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function getTransaction(transactionId: string, userId: string) {
  return await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
    omit: { userId: true },
    include: {
      location: {
        omit: {
          transactionId: true,
        },
      },
    },
  });
}

export async function createTransaction(
  transaction: Prisma.TransactionCreateInput,
) {
  return prisma.transaction.create({
    data: transaction,
    omit: { userId: true },
    include: {
      location: {
        omit: {
          transactionId: true,
        },
      },
    },
  });
}

export async function updateTransaction(
  transactionId: string,
  transaction: Prisma.TransactionUpdateInput,
) {
  return await prisma.transaction.update({
    where: {
      id: transactionId,
    },
    data: transaction,
    omit: { userId: true },
    include: {
      location: {
        omit: {
          transactionId: true,
        },
      },
    },
  });
}

export async function deleteTransaction(transactionId: string) {
  return await prisma.transaction.delete({
    where: {
      id: transactionId,
    },
  });
}
