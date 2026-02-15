import z from "zod";
import { createTransactionSchema } from "./transaction.js";

export const AITransactionSchema = z.object({
  transactions: z.array(createTransactionSchema),
});

export const AIRequestSchema = z.object({
  model: z.string().optional(),
  prompt: z.string().min(1),
  data: AITransactionSchema,
});

export const AIResponseSchema = z.object({
  model: z.string(),
  result: z.string(),
});

export type AITransaction = z.infer<typeof AITransactionSchema>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
