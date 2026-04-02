import { ENV } from "../../config/env.js";
import type { Request, Response, NextFunction } from "express";
import { OpenAI } from "openai";
import { AppError } from "../../middleware/errorHandler.js";
import { prisma } from "../../prisma/client.js";

const CONTEXT_LIMIT = 20;
const systemContent =
  `You are a personal finance assistant. ` +
  `CRITICAL: Detect the language of the user question below and reply ONLY in that exact language. Ukrainian → Ukrainian. English → English. ` +
  `NEVER mention the language, NEVER say you detected anything, NEVER meta-comment. Just answer directly. ` +
  `Format rules: plain text only, no markdown, no tables, no bold, no emojis, no bullet points. ` +
  `2–3 sentences max. Use exact numbers from the data.`;

export async function getAIHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized: User not found in request", 401);
    }

    const messages = await prisma.message.findMany({
      where: { userId },
      orderBy: { created_at: "asc" },
    });

    const paired = [];
    for (let i = 0; i < messages.length; i++) {
      const currentMsg = messages[i];

      if (currentMsg && currentMsg.role === "user") {
        const nextMsg = messages[i + 1];

        paired.push({
          id: currentMsg.id,
          prompt: currentMsg.content,
          result:
            nextMsg?.role === "assistant"
              ? nextMsg.content
              : "Помилка отримання відповіді...",
          created_at: currentMsg.created_at,
        });

        if (nextMsg?.role === "assistant") i++;
      }
    }

    return res.json(paired.reverse());
  } catch (err) {
    next(err);
  }
}

export async function ai(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = ENV.GROQAPITOKENS;
    if (tokens.length === 0) {
      throw new AppError("No Groq API tokens found in configuration", 500);
    }

    const DEFAULT_MODEL = "llama-3.1-8b-instant";
    const { model, prompt, data } = req.body;
    const modelToUse = model ?? DEFAULT_MODEL;

    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized: User not found in request", 401);
    }

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

    const errorMessages: string[] = [];

    for (const token of tokens) {
      const client = new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: token,
      });

      try {
        const completion = await client.chat.completions.create({
          model: modelToUse,
          messages: [
            { role: "system", content: systemContent },
            ...contextMessages,
            {
              role: "user",
              content: `${prompt}\n\nData:\n${JSON.stringify(data)}`,
            },
          ],
        });

        const assistantContent = completion.choices[0]?.message.content ?? "";

        await prisma.message.createMany({
          data: [
            { role: "user", content: prompt, userId },
            { role: "assistant", content: assistantContent, userId },
          ],
        });

        return res.json({
          model: completion.model,
          result: assistantContent,
        });
      } catch (err) {
        errorMessages.push(err instanceof Error ? err.message : String(err));
      }
    }

    throw new AppError(`All tokens failed:\n${errorMessages.join("\n")}`, 500);
  } catch (err) {
    next(err);
  }
}
