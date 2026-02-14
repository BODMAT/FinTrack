import z from "zod";
import { AIResponseSchema } from "@fintrack/types";

export const AIResponseWithDiffSchema = AIResponseSchema.extend({
	getted_at: z.date(),
	prompt: z.string(),
	id: z.string(),
});

export const AIHistorySchema = z.array(AIResponseWithDiffSchema);

export type AIResponseWithDiff = z.infer<typeof AIResponseWithDiffSchema>;
export type AIHistory = z.infer<typeof AIHistorySchema>;
