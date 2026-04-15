import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { requireVerifiedUser } from "../../middleware/authz.js";
import {
  donationCheckoutLimiter,
  donationWebhookLimiter,
} from "../../middleware/rateLimit.js";
import {
  createDonationSession,
  donationLeaderboard,
  stripeWebhook,
} from "./controller.js";

export const donationRouter = express.Router();

donationRouter.post(
  "/checkout-session",
  donationCheckoutLimiter,
  authenticateToken,
  requireVerifiedUser,
  createDonationSession,
);

donationRouter.get(
  "/leaderboard",
  authenticateToken,
  requireVerifiedUser,
  donationLeaderboard,
);

donationRouter.post("/webhook", donationWebhookLimiter, stripeWebhook);
