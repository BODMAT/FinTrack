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
		throw new AppError(
			`Missing required environment variable: ${key}`,
			500,
		);
	}
}

const HF_API_TOKENS = Object.keys(process.env)
	.filter((key) => key.startsWith("HF_API_TOKEN"))
	.map((key) => process.env[key])
	.filter((token): token is string => Boolean(token));

if (HF_API_TOKENS.length === 0) {
	console.warn(
		"⚠️ Warning: No Hugging Face API tokens (HF_API_TOKEN_x) found in .env",
	);
}

export const ENV = {
	NODE_ENV: process.env.NODE_ENV ?? "development",
	HOST: process.env.HOST ?? "localhost",
	PORT: process.env.PORT ? Number(process.env.PORT) : 8000,
	DATABASE_URL: process.env.DATABASE_URL as string,
	REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
	ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
	HF_API_TOKENS,
} as const;

export type EnvConfig = typeof ENV;
