import z from "zod";
import {
  createTransactionSchema,
  manualCurrencyCodeSchema,
  transactionSourceSchema,
} from "@fintrack/types";

export const paginationSchema = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    perPage: z.coerce.number().int().positive().optional(),
    source: transactionSourceSchema.optional(),
  })
  .refine(
    (data) => (data.page === undefined) === (data.perPage === undefined),
    {
      message: "Both page and perPage must be provided together, or neither.",
    },
  );

export const formTransactionSchema = createTransactionSchema
  .omit({ location: true })
  .extend({
    amount: z.string().min(1, "Amount is required"),
    currencyCode: manualCurrencyCodeSchema.optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  });

export type Pagination = z.infer<typeof paginationSchema>;
export type FormTransaction = z.infer<typeof formTransactionSchema>;
