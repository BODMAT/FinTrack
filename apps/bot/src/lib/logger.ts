import pino from "pino";

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
