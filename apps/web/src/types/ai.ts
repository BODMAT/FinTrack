import z from "zod";
import { AIResponseSchema, type AiErrorCode } from "@fintrack/types";

export type { AiErrorCode };

export const AIResponseWithDiffSchema = AIResponseSchema.extend({
  getted_at: z.date(),
  prompt: z.string(),
  id: z.string(),
});

export const AIHistorySchema = z.array(AIResponseWithDiffSchema);

export const AiAccessSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
  tier: z.enum(["user", "donor", "admin"]),
  donationStatus: z.enum(["NONE", "ACTIVE", "EXPIRED"]),
  donationExpiresAt: z.string().datetime().nullable(),
  aiAnalysisUsed: z.number().int().nonnegative(),
  aiAnalysisLimit: z.number().int().positive(),
  remainingAttempts: z.number().int().nonnegative().nullable(),
  isUnlimited: z.boolean(),
});

export type AIResponseWithDiff = z.infer<typeof AIResponseWithDiffSchema>;
export type AIHistory = z.infer<typeof AIHistorySchema>;
export type AiAccess = z.infer<typeof AiAccessSchema>;
