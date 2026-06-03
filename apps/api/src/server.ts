import { ENV } from "./config/env.js";
import { app } from "./app.js";
import { prisma } from "./prisma/client.js";
import { connectMongo, disconnectMongo } from "./lib/mongo.js";

const HOST = ENV.HOST;
const PORT = ENV.PORT;

let server: ReturnType<typeof app.listen>;

(async () => {
  try {
    await prisma.$connect();
    await connectMongo();

    server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
      console.log(`📡 API: http://${HOST}:${PORT}/api`);
      console.log(`📚 API Docs: http://${HOST}:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("❌ Error while starting the app:", err);
    process.exit(1);
  }
})();

function gracefulShutdown(signal: string) {
  return async () => {
    console.log(`📴 Received ${signal}. Closing server...`);

    server.close(async () => {
      console.log("🌙 HTTP server closed.");

      try {
        await prisma.$disconnect();
        console.log("🔌 Prisma disconnected.");
        await disconnectMongo();
        process.exit(0);
      } catch (err) {
        console.error("❌ Error during shutdown:", err);
        process.exit(1);
      }
    });
  };
}

process.on("SIGINT", gracefulShutdown("SIGINT"));
process.on("SIGTERM", gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error(
    "❌ Unhandled Rejection:",
    reason instanceof Error ? reason.stack : reason,
  );
});
