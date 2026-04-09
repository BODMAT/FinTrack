import api from "./api";
import { handleRequest } from "@/utils/api";
import {
  type UserApiKey,
  UserApiKeySchema,
  UserApiKeysSchema,
} from "@fintrack/types";

export const getUserApiKeys = async (): Promise<UserApiKey[]> => {
  return handleRequest<UserApiKey[]>(
    api.get("user-api-keys"),
    UserApiKeysSchema,
  );
};

export const upsertUserApiKey = async (payload: {
  provider: "GROQ" | "GEMINI";
  apiKey: string;
}): Promise<UserApiKey> => {
  return handleRequest<UserApiKey>(
    api.put("user-api-keys", payload),
    UserApiKeySchema,
  );
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
