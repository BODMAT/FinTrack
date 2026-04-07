import type { Request, Response, NextFunction } from "express";
import { TransactionSource } from "@prisma/client";
import z from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import { getAllTransactions } from "../transaction/service.js";
import { groupData, getFullStats } from "./helpers.js";
import {
  RangeSchema as rangeSchema,
  type ResponseTransaction,
} from "@fintrack/types";

const sourceQuerySchema = z
  .enum([TransactionSource.MANUAL, TransactionSource.MONOBANK])
  .optional();

function getSourceFilter(rawSource: unknown): TransactionSource | undefined {
  const parsed = sourceQuerySchema.safeParse(rawSource);
  if (!parsed.success) {
    throw new AppError("Invalid source. Allowed values: MANUAL, MONOBANK", 400);
  }

  return parsed.data;
}

function convertToIData(
  transactionsData: Awaited<ReturnType<typeof getAllTransactions>>,
): ResponseTransaction[] {
  return transactionsData.data.map((t) => ({
    ...t,
    amount: Number(t.amount),
    currencyCode: t.currencyCode,
    created_at: new Date(t.created_at),
    updated_at: new Date(t.updated_at),
    location: t.location || undefined,
  }));
}

export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const source = getSourceFilter(req.query.source);

    const transactions = await getAllTransactions(userId, source);
    const data = convertToIData(transactions);
    const summary = getFullStats(data);
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

export async function getChartData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const source = getSourceFilter(req.query.source);

    const parsed = rangeSchema.safeParse(req.query.range);
    if (!parsed.success) {
      throw new AppError(
        "Invalid range. Must be: day, week, month, year, all",
        400,
      );
    }
    const range = parsed.data;

    const transactions = await getAllTransactions(userId, source);
    const data = convertToIData(transactions);
    const chartData = groupData(data, range);
    res.status(200).json(chartData);
  } catch (err) {
    next(err);
  }
}
