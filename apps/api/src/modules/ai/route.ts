import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { requireVerifiedUser } from "../../middleware/authz.js";
import { ai, getAIHistory } from "./controller.js";

export const aiRouter = express.Router();

aiRouter.get("/history", authenticateToken, requireVerifiedUser, getAIHistory);
aiRouter.post("/", authenticateToken, requireVerifiedUser, ai);
