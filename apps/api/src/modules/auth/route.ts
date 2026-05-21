import express from "express";
import {
  login,
  token,
  logout,
  logoutAll,
  authenticateToken,
  googleExchange,
  telegramExchange,
  telegramRefresh,
  verifyEmail,
  resendVerification,
} from "./controller.js";
import {
  authLoginLimiter,
  authLogoutLimiter,
  authRefreshLimiter,
  resendVerificationLimiter,
} from "../../middleware/rateLimit.js";

export const authRouter = express.Router();

authRouter.post("/login", authLoginLimiter, login);
authRouter.post("/google/exchange", authLoginLimiter, googleExchange);
authRouter.post("/telegram/exchange", authLoginLimiter, telegramExchange);
authRouter.post("/telegram/refresh", authRefreshLimiter, telegramRefresh);
authRouter.post("/token", authRefreshLimiter, token);
authRouter.delete("/logout", authLogoutLimiter, logout);
authRouter.post("/logout-all", authenticateToken, authLogoutLimiter, logoutAll);
authRouter.get("/verify-email", verifyEmail);
authRouter.post(
  "/resend-verification",
  resendVerificationLimiter,
  resendVerification,
);
