import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler.js";
import { prisma } from "../../prisma/client.js";
import { getAiResponse, AiServiceError } from "./service.js";

export async function getAIHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId)
      throw new AppError("Unauthorized: User not found in request", 401);

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
          result: nextMsg?.role === "assistant" ? nextMsg.content : "",
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
    const userId = req.user?.id;
    if (!userId)
      throw new AppError("Unauthorized: User not found in request", 401);

    const { model, prompt, data } = req.body as {
      model?: string;
      prompt: string;
      data: object;
    };

    if (!prompt || !data)
      throw new AppError("Invalid input data or prompt", 400);

    const response = await getAiResponse(userId, prompt, data, model);
    return res.json(response);
  } catch (err) {
    if (err instanceof AiServiceError) {
      // фронт читает `code` для показа нужного попапа
      return res.status(503).json({ error: err.message, code: err.code });
    }
    next(err);
  }
}
