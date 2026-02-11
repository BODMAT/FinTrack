import express from "express";
// import type { Request, Response, NextFunction } from "express";
import { userRouter } from "../modules/user/route.js";
import { authRouter } from "../modules/auth/route.js";
import { transactionRouter } from "../modules/transaction/route.js";
import { aiRouter } from "../modules/ai/route.js";
import { summaryRouter } from "../modules/summary/route.js";

export const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/summary", summaryRouter);

// apiRouter.all("*", (req: Request, res: Response, next: NextFunction) => {
// 	res.status(404).json({ error: "Endpoint not found" });
// });