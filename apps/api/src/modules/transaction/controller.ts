import type { Request, Response, NextFunction } from "express";
import { Prisma, TransactionSource, TransactionType } from "@prisma/client";
import z from "zod";
import * as transactionService from "./service.js";
import { AppError } from "../../middleware/errorHandler.js";
import {
  createTransactionSchema,
  manualCurrencyCodeSchema,
  monobankFetchPayloadSchema,
  monobankImportPayloadSchema,
  monobankTokenSchema,
  type MonobankAccount,
  type MonobankClientInfoResponse,
  type MonobankStatementItem,
  updateTransactionSchema,
} from "@fintrack/types";

const MONOBANK_API_BASE_URL = "https://api.monobank.ua";
const MONOBANK_FETCH_COOLDOWN_SECONDS = 60;
const MONOBANK_MAX_STATEMENT_RANGE_SECONDS = 2_682_000;
const monobankClientInfoByUser = new Map<string, number>();
const monobankStatementByUser = new Map<string, number>();

const sourceQuerySchema = z
  .enum([TransactionSource.MANUAL, TransactionSource.MONOBANK])
  .optional();

function normalizeCurrencyCode(input?: string) {
  if (!input) return "USD";
  const normalized = input.trim().toUpperCase();
  const parsed = manualCurrencyCodeSchema.safeParse(normalized);
  return parsed.success ? parsed.data : "USD";
}

function numericCurrencyToCode(code?: number) {
  if (code === 980) return "UAH";
  if (code === 840) return "USD";
  if (code === 978) return "EUR";
  return "USD";
}

function getSourceFilter(rawSource: unknown): TransactionSource | undefined {
  const parsed = sourceQuerySchema.safeParse(rawSource);
  if (!parsed.success) {
    throw new AppError("Invalid source. Allowed values: MANUAL, MONOBANK", 400);
  }

  return parsed.data;
}

function resolveStatementRange(from?: number, to?: number) {
  const nowUnix = Math.floor(Date.now() / 1000);
  const resolvedTo = to ?? nowUnix;
  const resolvedFrom =
    from ?? resolvedTo - (MONOBANK_MAX_STATEMENT_RANGE_SECONDS - 3600);

  if (resolvedFrom >= resolvedTo) {
    throw new AppError(
      "Invalid time range: 'from' must be less than 'to'",
      400,
    );
  }

  if (resolvedTo - resolvedFrom > MONOBANK_MAX_STATEMENT_RANGE_SECONDS) {
    throw new AppError(
      `Invalid time range: max allowed interval is ${MONOBANK_MAX_STATEMENT_RANGE_SECONDS} seconds`,
      400,
    );
  }

  return { from: resolvedFrom, to: resolvedTo };
}

function enforceMonobankCooldown(
  userId: string,
  operation: "client-info" | "statement",
) {
  const map =
    operation === "client-info"
      ? monobankClientInfoByUser
      : monobankStatementByUser;
  const nowMs = Date.now();
  const previousRequestMs = map.get(userId);

  if (previousRequestMs) {
    const diffMs = nowMs - previousRequestMs;
    const cooldownMs = MONOBANK_FETCH_COOLDOWN_SECONDS * 1000;
    if (diffMs < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - diffMs) / 1000);
      throw new AppError(
        `Monobank request cooldown is ${MONOBANK_FETCH_COOLDOWN_SECONDS}s. Retry after ${retryAfter}s.`,
        429,
        { retryAfter },
      );
    }
  }

  map.set(userId, nowMs);
}

async function fetchMonobankJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Token": token,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorPayload: unknown = null;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = await response.text();
    }

    if (response.status === 429) {
      throw new AppError(
        "Monobank rate limit exceeded. Retry in 60 seconds.",
        429,
        {
          monobank: errorPayload,
        },
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new AppError("Invalid Monobank token", 401, {
        monobank: errorPayload,
      });
    }

    throw new AppError(
      "Failed to fetch data from Monobank API",
      response.status,
      {
        monobank: errorPayload,
      },
    );
  }

  return (await response.json()) as T;
}

function mapMonobankStatementToPreview(
  sourceAccountId: string,
  fallbackCurrencyCodeNumeric: number | undefined,
  tx: MonobankStatementItem,
) {
  const rawAmount = Number(tx.amount);
  const normalizedAmount = Math.abs(rawAmount) / 100;
  const type =
    rawAmount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;

  return {
    title:
      tx.description?.trim() || tx.comment?.trim() || "Monobank transaction",
    type,
    amount: normalizedAmount,
    currencyCode: numericCurrencyToCode(
      tx.currencyCode ?? fallbackCurrencyCodeNumeric,
    ),
    created_at: new Date(tx.time * 1000),
    sourceTransactionId: tx.id,
    sourceAccountId,
    source: TransactionSource.MONOBANK,
  };
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

export async function fetchMonobankTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const payload = monobankFetchPayloadSchema.parse(req.body);
    const { from, to } = resolveStatementRange(payload.from, payload.to);

    enforceMonobankCooldown(userId, "statement");

    let selectedAccountId = payload.accountId;
    let selectedAccount: MonobankAccount | null = null;

    if (!selectedAccountId) {
      enforceMonobankCooldown(userId, "client-info");
      const clientInfo = await fetchMonobankJson<MonobankClientInfoResponse>(
        `${MONOBANK_API_BASE_URL}/personal/client-info`,
        payload.token,
      );
      const accounts = clientInfo.accounts ?? [];
      if (accounts.length === 0) {
        throw new AppError(
          "No Monobank accounts available for this token",
          404,
        );
      }
      selectedAccount = accounts[0] ?? null;
      selectedAccountId = selectedAccount?.id;
    }

    if (!selectedAccountId) {
      throw new AppError("Monobank account id is required", 400);
    }

    const statement = await fetchMonobankJson<MonobankStatementItem[]>(
      `${MONOBANK_API_BASE_URL}/personal/statement/${selectedAccountId}/${from}/${to}`,
      payload.token,
    );

    const transactions = statement.map((tx) =>
      mapMonobankStatementToPreview(
        selectedAccountId,
        payload.accountCurrencyCode,
        tx,
      ),
    );

    res.status(200).json({
      account: selectedAccount ?? {
        id: selectedAccountId,
      },
      accounts: [],
      from,
      to,
      transactions,
      meta: {
        source: TransactionSource.MONOBANK,
        cooldownSeconds: MONOBANK_FETCH_COOLDOWN_SECONDS,
        maxRangeSeconds: MONOBANK_MAX_STATEMENT_RANGE_SECONDS,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function fetchMonobankAccounts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const payload = monobankTokenSchema.parse(req.body);
    enforceMonobankCooldown(userId, "client-info");

    const clientInfo = await fetchMonobankJson<MonobankClientInfoResponse>(
      `${MONOBANK_API_BASE_URL}/personal/client-info`,
      payload.token,
    );

    const accounts = clientInfo.accounts ?? [];
    if (accounts.length === 0) {
      throw new AppError("No Monobank accounts available for this token", 404);
    }

    res.status(200).json({
      accounts: accounts.map((account) => ({
        id: account.id,
        type: account.type,
        currencyCode: account.currencyCode,
        cashbackType: account.cashbackType,
        balance: account.balance,
        creditLimit: account.creditLimit,
        maskedPan: account.maskedPan ?? [],
        iban: account.iban,
      })),
      meta: {
        source: TransactionSource.MONOBANK,
        cooldownSeconds: MONOBANK_FETCH_COOLDOWN_SECONDS,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function importMonobankTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const payload = monobankImportPayloadSchema.parse(req.body);

    const result = await transactionService.importMonobankTransactions(
      userId,
      payload.transactions,
    );

    res.status(200).json({
      ...result,
      source: TransactionSource.MONOBANK,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMonobankTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const result =
      await transactionService.deleteAllMonobankTransactions(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
