import { z } from "zod";

export const LoginUserBodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginUserBody = z.infer<typeof LoginUserBodySchema>;

export const LoginUserResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type LoginUserResponse = z.infer<typeof LoginUserResponseSchema>;

export const TokenUserBodySchema = z.object({
  token: z.string().min(1, "Token is required"),
});
export type TokenUserBody = z.infer<typeof TokenUserBodySchema>;

export const TokenUserResponseSchema = z.object({ accessToken: z.string() });
export type TokenUserResponse = z.infer<typeof TokenUserResponseSchema>;
