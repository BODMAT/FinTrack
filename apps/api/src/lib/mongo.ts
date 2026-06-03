import mongoose from "mongoose";
import { ENV } from "../config/env.js";
import { logger } from "./logger.js";

export async function connectMongo() {
  if (!ENV.MONGO_URL) {
    logger.warn("MONGO_URL not set — audit logging disabled");
    return;
  }
  await mongoose.connect(ENV.MONGO_URL);
  logger.info("MongoDB connected");
}

export async function disconnectMongo() {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
