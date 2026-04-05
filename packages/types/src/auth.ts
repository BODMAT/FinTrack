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
