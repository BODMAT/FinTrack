import api from "./api";
import { handleRequest } from "@/utils/api";

export interface UserApiKey {
  id: string;
  provider: "GROQ" | "GEMINI";
  isActive: boolean;
  maskedKey: string;
  createdAt: string;
  updatedAt: string;
}

export const getUserApiKeys = async (): Promise<UserApiKey[]> => {
  return handleRequest<UserApiKey[]>(api.get("user-api-keys"));
};

export const upsertUserApiKey = async (payload: {
  provider: "GROQ" | "GEMINI";
  apiKey: string;
}): Promise<UserApiKey> => {
  return handleRequest<UserApiKey>(api.put("user-api-keys", payload));
};

export const deleteUserApiKey = async (
  provider: "GROQ" | "GEMINI",
): Promise<void> => {
  return handleRequest<void>(api.delete(`user-api-keys/${provider}`));
};

export const toggleUserApiKey = async (
  provider: "GROQ" | "GEMINI",
): Promise<{ isActive: boolean; provider: string }> => {
  return handleRequest(api.patch(`user-api-keys/${provider}/toggle`));
};
