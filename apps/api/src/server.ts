import type { Server } from "node:http";
import { ENV } from "./config/env.js";
import { redis } from "./lib/redis.js";
import { prisma } from "./prisma/client.js";
import { connectMongo, disconnectMongo } from "./lib/mongo.js";
import { logger } from "./lib/logger.js";

const HOST = ENV.HOST;
const PORT = ENV.PORT;

let server: Server;

(async () => {
  try {
    await redis.connect();
    logger.info("Redis connected");

    await prisma.$connect();
    await connectMongo();

    // Dynamic import ensures app (and rate limiters) initialize after Redis is ready
    const { app } = await import("./app.js");

    server = app.listen(PORT, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      logger.info(`API: http://${HOST}:${PORT}/api`);
      logger.info(`Docs: http://${HOST}:${PORT}/api-docs`);
    });
  } catch (err) {
    logger.error({ err }, "Error while starting the app");
    process.exit(1);
  }
})();

function gracefulShutdown(signal: string) {
  return async () => {
    logger.info(`Received ${signal}. Closing server...`);

    server.close(async () => {
      logger.info("HTTP server closed");

      try {
        await prisma.$disconnect();
        logger.info("Prisma disconnected");
        await disconnectMongo();
        await redis.quit();
        logger.info("Redis disconnected");
        process.exit(0);
      } catch (err) {
        logger.error({ err }, "Error during shutdown");
        process.exit(1);
      }
    });
  };
}

process.on("SIGINT", gracefulShutdown("SIGINT"));
process.on("SIGTERM", gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error(
    { reason: reason instanceof Error ? reason.stack : reason },
    "Unhandled Rejection",
  );
});
