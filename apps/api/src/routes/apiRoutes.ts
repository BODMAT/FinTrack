import express from "express";
import { userRouter } from "./userRoutes.js";
import { transactionRouter } from "./transactionRoutes.js";

export const apiRouter = express.Router();

apiRouter.use("/users", userRouter);
apiRouter.use("/transactions", transactionRouter);