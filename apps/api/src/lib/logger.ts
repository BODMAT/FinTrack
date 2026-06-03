import pino from "pino";
import { getRequestId } from "./requestContext.js";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

export const logger = pino({
  level: isTest ? "silent" : isProduction ? "info" : "debug",
  ...(!isProduction &&
    !isTest && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    }),
});

export function getLogger(extra?: Record<string, unknown>) {
  const requestId = getRequestId();
  if (requestId ?? extra) {
    return logger.child({ ...(requestId ? { requestId } : {}), ...extra });
  }
  return logger;
}
