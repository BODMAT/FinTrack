import dotenv from "dotenv";
import { AppError } from "../middleware/errorHandler.js";

dotenv.config();

const requiredEnvVars = [
  "DATABASE_URL",
  "REFRESH_TOKEN_SECRET",
  "ACCESS_TOKEN_SECRET",
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new AppError(`Missing required environment variable: ${key}`, 500);
  }
}

const GROQAPITOKENS = Object.keys(process.env)
  .filter((key) => key.startsWith("GROQ_API_KEY_"))
  .map((key) => process.env[key])
  .filter((token): token is string => Boolean(token));

if (GROQAPITOKENS.length === 0) {
  console.warn("⚠️ Warning: No Groq API tokens (GROQ_API_KEY_x) found in .env");
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  HOST: process.env.HOST ?? "localhost",
  PORT: process.env.PORT ? Number(process.env.PORT) : 8000,
  DATABASE_URL: process.env.DATABASE_URL as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  GROQAPITOKENS,
} as const;

export type EnvConfig = typeof ENV;
