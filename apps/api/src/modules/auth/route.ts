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
  linkTelegram,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "./controller.js";
import {
  authLoginLimiter,
  authLogoutLimiter,
  authRefreshLimiter,
  resendVerificationLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from "../../middleware/rateLimit.js";

export const authRouter = express.Router();

authRouter.post("/login", authLoginLimiter, login);
authRouter.post("/google/exchange", authLoginLimiter, googleExchange);
authRouter.post("/telegram/exchange", authLoginLimiter, telegramExchange);
authRouter.post("/telegram/refresh", authRefreshLimiter, telegramRefresh);
authRouter.post(
  "/link/telegram",
  authenticateToken,
  authLoginLimiter,
  linkTelegram,
);
authRouter.post("/token", authRefreshLimiter, token);
authRouter.delete("/logout", authLogoutLimiter, logout);
authRouter.post("/logout-all", authenticateToken, authLogoutLimiter, logoutAll);
authRouter.get("/verify-email", verifyEmail);
authRouter.post(
  "/resend-verification",
  resendVerificationLimiter,
  resendVerification,
);
authRouter.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
authRouter.post("/reset-password", resetPasswordLimiter, resetPassword);
