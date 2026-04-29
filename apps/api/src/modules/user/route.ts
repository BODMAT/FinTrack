import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { registrationLimiter } from "../../middleware/rateLimit.js";
import {
  getCurrentUser,
  createUser,
  updateCurrentUser,
  deleteCurrentUser,
  deleteAuthMethodForCurrentUser,
} from "./controller.js";

export const userRouter = express.Router();

// userRouter.get("/:id", authenticateToken, getUser);
userRouter.get("/me", authenticateToken, getCurrentUser);
userRouter.post("/", registrationLimiter, createUser);
// userRouter.patch("/:id", authenticateToken, updateUser);
userRouter.patch("/me", authenticateToken, updateCurrentUser);
// userRouter.delete("/:id", authenticateToken, deleteUser);
userRouter.delete("/me", authenticateToken, deleteCurrentUser);
// userRouter.delete("/:userId/auth-methods/:authMethodId", authenticateToken, deleteAuthMethod);
userRouter.delete(
  "/me/auth-methods/:authMethodId",
  authenticateToken,
  deleteAuthMethodForCurrentUser,
);
