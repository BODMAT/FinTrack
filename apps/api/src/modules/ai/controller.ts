import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/errorHandler.js";
import {
  getAiResponse,
  getAIHistory as getAIHistoryFromService,
  AiServiceError,
  ensureAiAccessOrThrow,
  getAiAccessStatus,
  incrementAiAnalysisUsage,
} from "./service.js";

export async function getAIHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId)
      throw new AppError("Unauthorized: User not found in request", 401);

    const history = await getAIHistoryFromService(userId);
    return res.json(history);
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

    const access = await ensureAiAccessOrThrow(userId);
    const response = await getAiResponse(userId, prompt, data, model);
    await incrementAiAnalysisUsage(userId, access);
    return res.json(response);
  } catch (err) {
    if (err instanceof AiServiceError) {
      // фронт читает `code` для показа нужного попапа
      return res.status(503).json({ error: err.message, code: err.code });
    }
    next(err);
  }
}

export async function getAiAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId)
      throw new AppError("Unauthorized: User not found in request", 401);

    const access = await getAiAccessStatus(userId);
    return res.json({
      role: access.role,
      tier: access.tier,
      donationStatus: access.donationStatus,
      donationExpiresAt: access.donationExpiresAt,
      aiAnalysisUsed: access.aiAnalysisUsed,
      aiAnalysisLimit: access.aiAnalysisLimit,
      remainingAttempts: access.remainingAttempts,
      isUnlimited: access.isUnlimited,
    });
  } catch (err) {
    next(err);
  }
}
