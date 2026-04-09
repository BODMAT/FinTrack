import { Prisma, TransactionSource, TransactionType } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

type SourceFilter = TransactionSource | undefined;

type MonobankImportTransaction = {
  title: string;
  type: TransactionType;
  amount: number;
  currencyCode: NonNullable<Prisma.TransactionCreateManyInput["currencyCode"]>;
  created_at: Date;
  sourceTransactionId: string;
  sourceAccountId: string;
};

function buildTransactionWhere(userId: string, source?: SourceFilter) {
  return source ? { userId, source } : { userId };
}

export async function getAllTransactions(
  userId: string,
  source?: SourceFilter,
) {
  const transactions = await prisma.transaction.findMany({
    where: buildTransactionWhere(userId, source),
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
  source?: SourceFilter,
) {
  const where = buildTransactionWhere(userId, source);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
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
    prisma.transaction.count({ where }),
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
    data: {
      source: TransactionSource.MANUAL,
      ...transaction,
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

export async function importMonobankTransactions(
  userId: string,
  transactions: MonobankImportTransaction[],
) {
  if (transactions.length === 0) {
    return {
      imported: 0,
      skipped: 0,
      total: 0,
    };
  }

  const importedAt = new Date();

  const result = await prisma.transaction.createMany({
    data: transactions.map((tx) => ({
      title: tx.title,
      type: tx.type,
      amount: new Prisma.Decimal(tx.amount),
      currencyCode: tx.currencyCode,
      created_at: tx.created_at,
      source: TransactionSource.MONOBANK,
      sourceTransactionId: tx.sourceTransactionId,
      sourceAccountId: tx.sourceAccountId,
      importedAt,
      userId,
    })),
    skipDuplicates: true,
  });

  return {
    imported: result.count,
    skipped: transactions.length - result.count,
    total: transactions.length,
  };
}

export async function deleteAllMonobankTransactions(userId: string) {
  const result = await prisma.transaction.deleteMany({
    where: {
      userId,
      source: TransactionSource.MONOBANK,
    },
  });

  return {
    deleted: result.count,
    source: TransactionSource.MONOBANK,
  };
}
