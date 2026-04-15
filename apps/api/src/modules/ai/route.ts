import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { requireVerifiedUser } from "../../middleware/authz.js";
import { ai, getAIHistory, getAiAccess } from "./controller.js";

export const aiRouter = express.Router();

aiRouter.get("/history", authenticateToken, requireVerifiedUser, getAIHistory);
aiRouter.get("/access", authenticateToken, requireVerifiedUser, getAiAccess);
aiRouter.post("/", authenticateToken, requireVerifiedUser, ai);
