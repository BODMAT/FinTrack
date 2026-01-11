import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { getAllUsers, getUser, getCurrentUser, createUser, updateUser, updateCurrentUser, deleteUser, deleteCurrentUser, deleteAuthMethod, deleteAuthMethodForCurrentUser } from "./controller.js";

export const userRouter = express.Router();

//TODO: REMOVE getAll from prod api
userRouter.get("/", getAllUsers);

// userRouter.get("/:id", authenticateToken, getUser);
userRouter.get("/me", authenticateToken, getCurrentUser);
userRouter.post("/", createUser);
// userRouter.patch("/:id", authenticateToken, updateUser);
userRouter.patch("/me", authenticateToken, updateCurrentUser);
// userRouter.delete("/:id", authenticateToken, deleteUser);
userRouter.delete("/me", authenticateToken, deleteCurrentUser);
// userRouter.delete("/:userId/auth-methods/:authMethodId", authenticateToken, deleteAuthMethod);
userRouter.delete("/me/auth-methods/:authMethodId", authenticateToken, deleteAuthMethodForCurrentUser);
