import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";
import { csrfProtection } from "./middleware/csrf.js";
import { apiRouter } from "./routes/apiRoutes.js";
import { swaggerDocs } from "./docs/swagger.js";
import { ENV } from "./config/env.js";

export const app = express();

const configuredOrigins = ENV.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];
const allowedOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : ENV.NODE_ENV === "production"
      ? []
      : defaultDevOrigins;

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(
  "/api/donations/webhook",
  express.raw({ type: "application/json", limit: "256kb" }),
);
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use("/api", csrfProtection(allowedOrigins));

app.use("/api", apiRouter);
swaggerDocs(app);

app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);
