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

export const AiErrorCodeSchema = z.enum([
  "USER_KEY_LIMIT",
  "USER_KEY_INVALID",
  "DEFAULT_KEY_LIMIT",
  "ALL_KEYS_FAILED",
  "USING_DEFAULT_KEY",
]);

export const MessageFromDBSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  result: z.string(),
  created_at: z.string().optional(),
  gettedat: z.string().optional(),
});

export const UserApiKeySchema = z.object({
  id: z.string(),
  provider: z.enum(["GROQ", "GEMINI"]),
  isActive: z.boolean(),
  maskedKey: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UserApiKeysSchema = z.array(UserApiKeySchema);

export type AITransaction = z.infer<typeof AITransactionSchema>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type AiErrorCode = z.infer<typeof AiErrorCodeSchema>;
export type MessageFromDB = z.infer<typeof MessageFromDBSchema>;
export type UserApiKey = z.infer<typeof UserApiKeySchema>;
