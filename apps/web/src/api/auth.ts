import {
  type LoginUserBody,
  LoginUserResponseSchema,
  type TokenUserBody,
  TokenUserResponseSchema,
  type TokenUserResponse,
  type LoginUserResponse,
  type TelegramWidgetPayload,
  type LinkTelegramResponse,
  LinkTelegramResponseSchema,
} from "@fintrack/types";
import { handleRequest } from "@/utils/api";
import api from "./api";

export const loginUser = async (
  payload: LoginUserBody,
): Promise<LoginUserResponse> => {
  return handleRequest(
    api.post("/auth/login", payload),
    LoginUserResponseSchema,
  );
};

export const tokenUser = async (
  payload?: TokenUserBody,
): Promise<TokenUserResponse> => {
  return handleRequest(
    api.post("/auth/token", payload ?? {}),
    TokenUserResponseSchema,
  );
};

export const logoutUser = async (): Promise<void> => {
  return handleRequest(api.delete("/auth/logout"));
};

export const logoutAllUser = async (): Promise<void> => {
  return handleRequest(api.post("/auth/logout-all"));
};

export const exchangeGoogleSession = async (idToken: string): Promise<void> => {
  await handleRequest(api.post("/auth/google/exchange", { idToken }));
};

export const exchangeTelegramWidgetSession = async (
  telegram: TelegramWidgetPayload,
): Promise<void> => {
  await handleRequest(
    api.post("/auth/telegram/exchange", { source: "widget", telegram }),
  );
};

export const linkTelegramAccount = async (
  telegram: TelegramWidgetPayload,
): Promise<LinkTelegramResponse> => {
  return handleRequest(
    api.post("/auth/link/telegram", { telegram }),
    LinkTelegramResponseSchema,
  );
};

export const resendVerificationEmail = async (
  email: string,
): Promise<{ sent: boolean }> => {
  return handleRequest(api.post("/auth/resend-verification", { email }));
};

export const forgotPassword = async (
  email: string,
): Promise<{ sent: boolean }> => {
  return handleRequest(api.post("/auth/forgot-password", { email }));
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<{ reset: boolean }> => {
  return handleRequest(api.post("/auth/reset-password", { token, password }));
};
