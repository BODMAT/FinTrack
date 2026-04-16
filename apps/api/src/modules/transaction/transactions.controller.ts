import type { Request, Response, NextFunction } from "express";
import { Prisma, TransactionSource } from "@prisma/client";
import z from "zod";
import * as transactionService from "./service.js";
import { AppError } from "../../middleware/errorHandler.js";
import {
  createTransactionSchema,
  manualCurrencyCodeSchema,
  updateTransactionSchema,
} from "@fintrack/types";

const sourceQuerySchema = z
  .enum([TransactionSource.MANUAL, TransactionSource.MONOBANK])
  .optional();

function normalizeCurrencyCode(input?: string) {
  if (!input) return "USD";
  const normalized = input.trim().toUpperCase();
  const parsed = manualCurrencyCodeSchema.safeParse(normalized);
  return parsed.success ? parsed.data : "USD";
}

function getSourceFilter(rawSource: unknown): TransactionSource | undefined {
  const parsed = sourceQuerySchema.safeParse(rawSource);
  if (!parsed.success) {
    throw new AppError("Invalid source. Allowed values: MANUAL, MONOBANK", 400);
  }

  return parsed.data;
}

export async function getAllTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const source = getSourceFilter(req.query.source);

    const hasPage = req.query.page !== undefined;
    const hasPerPage = req.query.perPage !== undefined;

    if (hasPage !== hasPerPage) {
      throw new AppError(
        "Both 'page' and 'perPage' are required for pagination",
        400,
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
        throw new AppError("Invalid pagination params", 400);
      }
      const transactions = await transactionService.getTransactionsPerPage(
        userId,
        page,
        perPage,
        source,
      );
      res.status(200).json(transactions);
      return;
    }

    const transactions = await transactionService.getAllTransactions(
      userId,
      source,
    );
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
    if (!id) throw new AppError("Transaction id is required", 400);
    if (Array.isArray(id)) {
      throw new AppError("Invalid id", 400);
    }
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
      currencyCode: normalizeCurrencyCode(validatedBody.currencyCode),
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
    const transaction = await transactionService.createTransaction(prismaData);
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
    if (!id) throw new AppError("Transaction id is required", 400);
    if (Array.isArray(id)) {
      throw new AppError("Invalid id", 400);
    }
    const validatedBody = updateTransactionSchema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const transactionOfCurrentUser = await transactionService.getTransaction(
      id,
      userId,
    );
    if (!transactionOfCurrentUser) throw new AppError("Not found", 404);
    if (transactionOfCurrentUser.source === TransactionSource.MONOBANK) {
      throw new AppError("Monobank transactions are read-only", 403);
    }

    const prismaData: Prisma.TransactionUpdateInput = {};
    if (validatedBody.title !== undefined)
      prismaData.title = validatedBody.title;
    if (validatedBody.type !== undefined) prismaData.type = validatedBody.type;
    if (validatedBody.amount !== undefined)
      prismaData.amount = validatedBody.amount;
    if (validatedBody.currencyCode !== undefined)
      prismaData.currencyCode = normalizeCurrencyCode(
        validatedBody.currencyCode,
      );
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
    if (!id) throw new AppError("Transaction id is required", 400);
    if (Array.isArray(id)) {
      throw new AppError("Invalid id", 400);
    }

    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const transactionOfCurrentUser = await transactionService.getTransaction(
      id,
      userId,
    );
    if (!transactionOfCurrentUser) throw new AppError("Not found", 404);
    if (transactionOfCurrentUser.source === TransactionSource.MONOBANK) {
      throw new AppError("Monobank transactions are read-only", 403);
    }

    await transactionService.deleteTransaction(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}
