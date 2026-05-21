import { Redis } from "ioredis";
import { config } from "./config.js";

export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err: Error) => {
  console.error("[Redis] connection error:", err.message);
});
