import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middleware/errorHandler.js";
import {
  createDonationCheckoutSession,
  getDonationLeaderboard,
  processStripeWebhook,
} from "./service.js";

export async function createDonationSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const idempotencyKeyHeader = req.headers["x-idempotency-key"];
    const idempotencyKey =
      typeof idempotencyKeyHeader === "string"
        ? idempotencyKeyHeader
        : undefined;

    const session = await createDonationCheckoutSession(userId, idempotencyKey);
    return res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      throw new AppError("Missing Stripe signature", 400);
    }

    if (!Buffer.isBuffer(req.body)) {
      throw new AppError("Invalid Stripe webhook payload", 400);
    }

    const result = await processStripeWebhook(req.body, signature);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function donationLeaderboard(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const leaderboard = await getDonationLeaderboard();
    return res.json({ items: leaderboard });
  } catch (err) {
    next(err);
  }
}
