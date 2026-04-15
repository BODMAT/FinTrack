import dotenv from "dotenv";
import { AppError } from "../middleware/errorHandler.js";

dotenv.config();

const requiredEnvVars = [
  "DATABASE_URL",
  "ACCESS_TOKEN_SECRET",
  "API_KEY_ENCRYPTION_SECRET",
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
  console.warn("Warning: No Groq API tokens (GROQ_API_KEY_x) found in .env");
}

if (
  process.env.STRIPE_DONATION_AMOUNT &&
  Number.isNaN(Number(process.env.STRIPE_DONATION_AMOUNT))
) {
  throw new AppError(
    "Invalid STRIPE_DONATION_AMOUNT. It must be a number in minor units.",
    500,
  );
}

if (
  process.env.STRIPE_DONATION_DURATION_DAYS &&
  Number.isNaN(Number(process.env.STRIPE_DONATION_DURATION_DAYS))
) {
  throw new AppError(
    "Invalid STRIPE_DONATION_DURATION_DAYS. It must be a number.",
    500,
  );
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  ENABLE_SWAGGER_IN_PROD: process.env.ENABLE_SWAGGER_IN_PROD === "true",
  HOST: process.env.HOST ?? "localhost",
  PORT: process.env.PORT ? Number(process.env.PORT) : 8000,
  CORS_ORIGINS: process.env.CORS_ORIGINS ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  DATABASE_URL: process.env.DATABASE_URL as string,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  GROQAPITOKENS,
  API_KEY_ENCRYPTION_SECRET: process.env.API_KEY_ENCRYPTION_SECRET as string,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  STRIPE_DONATION_PRICE_ID: process.env.STRIPE_DONATION_PRICE_ID ?? "",
  STRIPE_DONATION_SUCCESS_URL: process.env.STRIPE_DONATION_SUCCESS_URL ?? "",
  STRIPE_DONATION_CANCEL_URL: process.env.STRIPE_DONATION_CANCEL_URL ?? "",
  STRIPE_DONATION_CURRENCY: process.env.STRIPE_DONATION_CURRENCY ?? "usd",
  STRIPE_DONATION_AMOUNT: process.env.STRIPE_DONATION_AMOUNT
    ? Number(process.env.STRIPE_DONATION_AMOUNT)
    : undefined,
  STRIPE_DONATION_DURATION_DAYS: process.env.STRIPE_DONATION_DURATION_DAYS
    ? Number(process.env.STRIPE_DONATION_DURATION_DAYS)
    : undefined,
} as const;

export type EnvConfig = typeof ENV;
