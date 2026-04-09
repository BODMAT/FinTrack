import z from "zod";
import {
  transactionCurrencyCodeSchema,
  transactionSourceSchema,
  transactionTypeSchema,
} from "./transaction.js";

export const monobankFetchPayloadSchema = z.object({
  token: z.string().trim().min(20).max(500),
  from: z.number().int().optional(),
  to: z.number().int().optional(),
  accountId: z.string().trim().min(1).max(200).optional(),
  accountCurrencyCode: z.number().int().optional(),
});

export const monobankTokenSchema = z.object({
  token: z.string().trim().min(20).max(500),
});

export const monobankAccountSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  currencyCode: z.number().optional(),
  cashbackType: z.string().optional(),
  balance: z.number().optional(),
  creditLimit: z.number().optional(),
  maskedPan: z.array(z.string()).optional(),
  iban: z.string().optional(),
});

export const monobankClientInfoResponseSchema = z.object({
  clientId: z.string().optional(),
  name: z.string().optional(),
  accounts: z.array(monobankAccountSchema).optional(),
});

export const monobankStatementItemSchema = z.object({
  id: z.string(),
  time: z.number().int(),
  description: z.string().optional(),
  comment: z.string().optional(),
  amount: z.number(),
  currencyCode: z.number().optional(),
});

export const monobankAccountsResponseSchema = z.object({
  accounts: z.array(monobankAccountSchema),
  meta: z.object({
    source: transactionSourceSchema,
    cooldownSeconds: z.number(),
  }),
});

export const monobankPreviewTransactionSchema = z.object({
  title: z.string(),
  type: transactionTypeSchema,
  amount: z.number(),
  currencyCode: transactionCurrencyCodeSchema,
  created_at: z.coerce.date(),
  sourceTransactionId: z.string(),
  sourceAccountId: z.string(),
  source: transactionSourceSchema,
});

export const monobankFetchResponseSchema = z.object({
  account: z.object({
    id: z.string(),
    type: z.string().optional(),
    currencyCode: z.number().optional(),
    maskedPan: z.array(z.string()).optional(),
  }),
  accounts: z.array(
    z.object({
      id: z.string(),
      type: z.string().optional(),
      currencyCode: z.number().optional(),
      maskedPan: z.array(z.string()).optional(),
    }),
  ),
  from: z.number().int(),
  to: z.number().int(),
  transactions: z.array(monobankPreviewTransactionSchema),
  meta: z.object({
    source: transactionSourceSchema,
    cooldownSeconds: z.number(),
    maxRangeSeconds: z.number(),
  }),
});

export const monobankImportPayloadSchema = z.object({
  transactions: z.array(
    z.object({
      title: z.string().trim().min(1).max(50),
      type: transactionTypeSchema,
      amount: z.coerce.number().positive(),
      currencyCode: transactionCurrencyCodeSchema,
      created_at: z.coerce.date(),
      sourceTransactionId: z.string().trim().min(1).max(200),
      sourceAccountId: z.string().trim().min(1).max(200),
    }),
  ),
});

export const monobankImportResponseSchema = z.object({
  imported: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  source: transactionSourceSchema,
});

export type MonobankAccount = z.infer<typeof monobankAccountSchema>;
export type MonobankClientInfoResponse = z.infer<
  typeof monobankClientInfoResponseSchema
>;
export type MonobankStatementItem = z.infer<typeof monobankStatementItemSchema>;
export type MonobankAccountsResponse = z.infer<
  typeof monobankAccountsResponseSchema
>;
export type MonobankFetchPayload = z.infer<typeof monobankFetchPayloadSchema>;
export type MonobankPreviewTransaction = z.infer<
  typeof monobankPreviewTransactionSchema
>;
export type MonobankFetchResponse = z.infer<typeof monobankFetchResponseSchema>;
export type MonobankImportPayload = z.infer<typeof monobankImportPayloadSchema>;
export type MonobankImportResponse = z.infer<
  typeof monobankImportResponseSchema
>;
