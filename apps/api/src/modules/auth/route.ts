import express from "express";
import {
  login,
  token,
  logout,
  logoutAll,
  authenticateToken,
  googleExchange,
} from "./controller.js";
import {
  authLoginLimiter,
  authLogoutLimiter,
  authRefreshLimiter,
} from "../../middleware/rateLimit.js";

export const authRouter = express.Router();

authRouter.post("/login", authLoginLimiter, login);
authRouter.post("/google/exchange", authLoginLimiter, googleExchange);
authRouter.post("/token", authRefreshLimiter, token);
authRouter.delete("/logout", authLogoutLimiter, logout);
authRouter.post("/logout-all", authenticateToken, authLogoutLimiter, logoutAll);
