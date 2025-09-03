import express from "express";
import { analyze } from "../controllers/analyzeController.js";

export const analyzeRouter = express.Router();

analyzeRouter.post("/", analyze);