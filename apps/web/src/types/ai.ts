import z from "zod";
import { createTransactionSchema } from "./transaction";

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

export const AIResponseWithDiffSchema = AIResponseSchema.extend({
	getted_at: z.date(),
	prompt: z.string(),
	id: z.string(),
});

export const AIHistorySchema = z.array(AIResponseWithDiffSchema);

export type AIResponseWithDiff = z.infer<typeof AIResponseWithDiffSchema>;
export type AIHistory = z.infer<typeof AIHistorySchema>;
export type AITransaction = z.infer<typeof AITransactionSchema>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
