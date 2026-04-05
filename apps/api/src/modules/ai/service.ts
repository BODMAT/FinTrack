import OpenAI from "openai";
import { ENV } from "../../config/env.js";
import { prisma } from "../../prisma/client.js";
import { decryptApiKey } from "../../utils/crypto.js";
import type { AiProvider } from "@prisma/client";
import type { AiErrorCode } from "@fintrack/types";

const CONTEXT_LIMIT = 20;

export const systemContent = `You are a personal finance assistant.
CRITICAL: Detect the language of the user question below and reply ONLY in that exact language.
Ukrainian → Ukrainian. English → English. NEVER mention the language, NEVER say you detected anything,
NEVER meta-comment. Just answer directly.
Format rules: plain text only, no markdown, no tables, no bold, no emojis, no bullet points. 2–3 sentences max. Use exact numbers from the data.`;

type ServiceAiErrorCode = Exclude<AiErrorCode, "USING_DEFAULT_KEY">;

export class AiServiceError extends Error {
  constructor(
    public readonly code: ServiceAiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

async function callGroq(
  apiKey: string,
  modelToUse: string,
  contextMessages: { role: "user" | "assistant"; content: string }[],
  prompt: string,
  data: object,
) {
  const client = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  });
  const completion = await client.chat.completions.create({
    model: modelToUse,
    messages: [
      { role: "system", content: systemContent },
      ...contextMessages,
      { role: "user", content: `${prompt}\n\nData:\n${JSON.stringify(data)}` },
    ],
  });
  return completion;
}

async function callGemini(
  apiKey: string,
  modelToUse: string,
  contextMessages: { role: "user" | "assistant"; content: string }[],
  prompt: string,
  data: object,
) {
  const client = new OpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey,
  });
  const completion = await client.chat.completions.create({
    model: modelToUse,
    messages: [
      { role: "system", content: systemContent },
      ...contextMessages,
      { role: "user", content: `${prompt}\n\nData:\n${JSON.stringify(data)}` },
    ],
  });
  return completion;
}

function resolveModel(provider: AiProvider, requestedModel?: string): string {
  if (provider === "GROQ") {
    return requestedModel ?? "llama-3.1-8b-instant";
  }

  if (requestedModel && requestedModel.toLowerCase().includes("gemini")) {
    return requestedModel;
  }

  return "gemini-2.0-flash";
}

function getGeminiModelCandidates(requestedModel?: string): string[] {
  const defaults = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-3-flash-preview",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  if (!requestedModel) return defaults;

  if (requestedModel.toLowerCase().includes("gemini")) {
    return [requestedModel, ...defaults.filter((m) => m !== requestedModel)];
  }

  return defaults;
}

export async function getAiResponse(
  userId: string,
  prompt: string,
  data: object,
  model?: string,
) {
  const historyMessages = await prisma.message.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
    take: CONTEXT_LIMIT,
  });
  historyMessages.reverse();
  const contextMessages = historyMessages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const activeUserKey = await prisma.userApiKey.findFirst({
    where: { userId, isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (activeUserKey) {
    try {
      const decrypted = decryptApiKey(activeUserKey.apiKey);
      let completion: OpenAI.Chat.Completions.ChatCompletion;

      if (activeUserKey.provider === "GEMINI") {
        const geminiModels = getGeminiModelCandidates(model);
        let lastError: unknown = null;

        for (const geminiModel of geminiModels) {
          try {
            completion = await callGemini(
              decrypted,
              geminiModel,
              contextMessages,
              prompt,
              data,
            );
            const content = completion.choices[0]?.message.content ?? "";
            await saveMessages(userId, prompt, content);
            return { model: completion.model, result: content };
          } catch (err) {
            lastError = err;
            continue;
          }
        }

        throw lastError;
      }

      completion = await callGroq(
        decrypted,
        resolveModel(activeUserKey.provider, model),
        contextMessages,
        prompt,
        data,
      );
      const content = completion.choices[0]?.message.content ?? "";
      await saveMessages(userId, prompt, content);
      return { model: completion.model, result: content };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number }).status;
      if (status === 429 || msg.includes("rate_limit")) {
        throw new AiServiceError(
          "USER_KEY_LIMIT",
          "Your API key has reached its rate limit.",
        );
      }
      if (
        status === 400 ||
        status === 401 ||
        status === 403 ||
        status === 404
      ) {
        throw new AiServiceError(
          "USER_KEY_INVALID",
          "Your API key is invalid, unauthorized, or model access is unavailable.",
        );
      }
      throw new AiServiceError(
        "USER_KEY_INVALID",
        "Your API key is invalid or expired.",
      );
    }
  }

  // Fallback — default
  const defaultTokens = ENV.GROQAPITOKENS;
  if (defaultTokens.length === 0) {
    throw new AiServiceError("ALL_KEYS_FAILED", "No API keys configured.");
  }

  for (const token of defaultTokens) {
    try {
      const completion = await callGroq(
        token,
        resolveModel("GROQ", model),
        contextMessages,
        prompt,
        data,
      );
      const content = completion.choices[0]?.message.content ?? "";
      await saveMessages(userId, prompt, content);
      return { model: completion.model, result: content };
    } catch {
      continue;
    }
  }

  throw new AiServiceError(
    "DEFAULT_KEY_LIMIT",
    "Default AI service is temporarily unavailable. Add your own API key to continue.",
  );
}

async function saveMessages(userId: string, prompt: string, result: string) {
  await prisma.message.createMany({
    data: [
      { role: "user", content: prompt, userId },
      { role: "assistant", content: result, userId },
    ],
  });
}
