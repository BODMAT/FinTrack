import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { ai, getAIHistory } from "./controller.js";

export const aiRouter = express.Router();

aiRouter.get("/history", authenticateToken, getAIHistory);
aiRouter.post("/", authenticateToken, ai);
