import express from "express";
import type { Request, Response } from "express";
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
  "http://localhost:8080",
];

const allowedOrigins =
  ENV.NODE_ENV === "production"
    ? configuredOrigins
    : Array.from(new Set([...configuredOrigins, ...defaultDevOrigins]));

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy:
      ENV.NODE_ENV === "production"
        ? true
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:"],
              connectSrc: ["'self'"],
            },
          },
    crossOriginResourcePolicy: { policy: "same-origin" },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === "undefined") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);
app.use(
  "/api/donations/webhook",
  express.raw({ type: "application/json", limit: "256kb" }),
);

// Initialize Swagger (defines /api-docs and /api-docs.json)
swaggerDocs(app);

app.use(
  "/api",
  cookieParser(),
  csrfProtection,
  express.json({ limit: "32kb" }),
  express.urlencoded({ extended: true, limit: "32kb" }),
  apiRouter,
);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);
