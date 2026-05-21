import dotenv from "dotenv";
dotenv.config();

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN is required in .env");
if (!process.env.API_URL) throw new Error("API_URL is required in .env");

export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  API_URL: process.env.API_URL.replace(/\/$/, ""),
} as const;
