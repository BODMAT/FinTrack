import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/apiRoutes.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
	res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);