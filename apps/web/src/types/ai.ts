import z from "zod";
import { AIResponseSchema } from "@fintrack/types";

export const AIResponseWithDiffSchema = AIResponseSchema.extend({
  getted_at: z.date(),
  prompt: z.string(),
  id: z.string(),
});

export type AiErrorCode =
  | "USER_KEY_LIMIT"
  | "USER_KEY_INVALID"
  | "DEFAULT_KEY_LIMIT"
  | "ALL_KEYS_FAILED"
  | "USING_DEFAULT_KEY";

export const AIHistorySchema = z.array(AIResponseWithDiffSchema);

export type AIResponseWithDiff = z.infer<typeof AIResponseWithDiffSchema>;
export type AIHistory = z.infer<typeof AIHistorySchema>;
