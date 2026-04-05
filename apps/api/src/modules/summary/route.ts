import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { requireVerifiedUser } from "../../middleware/authz.js";
import { getSummary, getChartData } from "./controller.js";

export const summaryRouter = express.Router();

summaryRouter.get("/", authenticateToken, requireVerifiedUser, getSummary);
summaryRouter.get(
  "/chart",
  authenticateToken,
  requireVerifiedUser,
  getChartData,
);
