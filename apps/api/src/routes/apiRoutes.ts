import express from "express";
import { userRouter } from "./userRoutes.js";
import { transactionRouter } from "./transactionRoutes.js";
import { analyzeRouter } from "./analyzeRoutes.js";

export const apiRouter = express.Router();

apiRouter.use("/users", userRouter);
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/analyze", analyzeRouter);