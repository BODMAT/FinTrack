import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { ai } from "./controller.js";

export const aiRouter = express.Router();

aiRouter.post("/", authenticateToken, ai);