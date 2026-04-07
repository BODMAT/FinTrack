import z from "zod";

export const locationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const transactionSourceSchema = z.enum(["MANUAL", "MONOBANK"]);
export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);
export const transactionCurrencyCodeSchema = z.enum([
  "USD",
  "UAH",
  "RUB",
  "EUR",
]);
export const manualCurrencyCodeSchema = z.enum(["USD", "UAH", "RUB"]);
export const currencyCodeSchema = transactionCurrencyCodeSchema;

export const createTransactionSchema = z.object({
  title: z.string().min(1).max(50),
  type: transactionTypeSchema,
  amount: z.coerce.number().positive(),
  currencyCode: manualCurrencyCodeSchema.optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  location: locationSchema.nullish(),
});

export const updateTransactionSchema = z.object({
  title: z.string().min(1).max(50).optional(),
  type: transactionTypeSchema.optional(),
  amount: z.coerce.number().positive().optional(),
  currencyCode: manualCurrencyCodeSchema.optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  location: locationSchema.nullish(),
});

export const responseTransactionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(50),
  type: transactionTypeSchema,
  amount: z.coerce.number().positive(),
  currencyCode: transactionCurrencyCodeSchema,
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  location: locationSchema.nullish(),
});

export const transactionsListResponseSchema = z.object({
  data: z.array(responseTransactionSchema),
  pagination: z
    .object({
      page: z.number(),
      perPage: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

export type Location = z.infer<typeof locationSchema>;
export type TransactionSource = z.infer<typeof transactionSourceSchema>;
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type ResponseTransaction = z.infer<typeof responseTransactionSchema>;
export type TransactionsListResponse = z.infer<
  typeof transactionsListResponseSchema
>;
