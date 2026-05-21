import { Redis } from "ioredis";
import { ENV } from "./config/env.js";

export const redis = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err: Error) => {
  console.error("[Redis] connection error:", err.message);
});
