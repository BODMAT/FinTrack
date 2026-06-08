import { z } from "zod";

export const LoginUserBodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginUserBody = z.infer<typeof LoginUserBodySchema>;

export const LoginUserResponseSchema = z.object({
  authenticated: z.boolean(),
});
export type LoginUserResponse = z.infer<typeof LoginUserResponseSchema>;

export const TokenUserBodySchema = z.object({}).optional();
export type TokenUserBody = z.infer<typeof TokenUserBodySchema>;

export const TokenUserResponseSchema = z.object({ authenticated: z.boolean() });
export type TokenUserResponse = z.infer<typeof TokenUserResponseSchema>;

export const TelegramWidgetPayloadSchema = z.object({
  id: z.union([z.string().min(1), z.number().int().positive()]),
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().url().optional(),
  auth_date: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]),
  hash: z.string().regex(/^[a-f0-9]{64}$/i),
});
export type TelegramWidgetPayload = z.infer<typeof TelegramWidgetPayloadSchema>;

export const TelegramWidgetExchangeBodySchema = z.object({
  source: z.literal("widget"),
  telegram: TelegramWidgetPayloadSchema,
});
export type TelegramWidgetExchangeBody = z.infer<
  typeof TelegramWidgetExchangeBodySchema
>;

export const LinkTelegramBodySchema = z.object({
  telegram: TelegramWidgetPayloadSchema,
});
export type LinkTelegramBody = z.infer<typeof LinkTelegramBodySchema>;

export const LinkTelegramResponseSchema = z.object({ linked: z.boolean() });
export type LinkTelegramResponse = z.infer<typeof LinkTelegramResponseSchema>;
