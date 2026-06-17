import { Redis } from "ioredis";
import { config } from "../config.js";
import { logger } from "./logger.js";

export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err: Error) => {
  logger.error({ err }, "Redis connection error");
});
