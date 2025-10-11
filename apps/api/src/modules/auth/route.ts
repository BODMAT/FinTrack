import express from "express";
import { login, token, logout } from "./controller.js";

export const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/token", token);
authRouter.delete("/logout", logout);