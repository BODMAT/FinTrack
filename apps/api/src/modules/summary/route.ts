import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { getSummary, getChartData } from "./controller.js";

export const summaryRouter = express.Router();

summaryRouter.get("/", authenticateToken, getSummary);
summaryRouter.get("/chart", authenticateToken, getChartData);
