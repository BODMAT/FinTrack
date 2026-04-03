import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AiProvider } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler.js";
import * as service from "./service.js";

const UpsertSchema = z.object({
  provider: z.nativeEnum(AiProvider),
  apiKey: z.string().min(10),
});

const ProviderParamSchema = z.object({
  provider: z.nativeEnum(AiProvider),
});

export async function getApiKeys(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const keys = await service.getUserApiKeys(userId);
    res.status(200).json(keys);
  } catch (err) {
    next(err);
  }
}

export async function upsertApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const parsed = UpsertSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);
    const result = await service.upsertUserApiKey(
      userId,
      parsed.data.provider,
      parsed.data.apiKey,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const parsed = ProviderParamSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError("Invalid provider", 400);
    await service.deleteUserApiKey(userId, parsed.data.provider);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function toggleApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const parsed = ProviderParamSchema.safeParse(req.params);
    if (!parsed.success) throw new AppError("Invalid provider", 400);
    const result = await service.toggleUserApiKey(userId, parsed.data.provider);
    if (!result) throw new AppError("Key not found", 404);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
