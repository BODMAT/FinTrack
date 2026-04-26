import { ENV } from "../config/env.js";
import fs from "fs";
import path from "path";
import type { Express, Request, Response, NextFunction } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const rootDir = process.cwd();

const isDev = ENV.NODE_ENV !== "production";

function getSpec() {
  const { version } = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"),
  );

  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: "3.1.0",
      info: {
        title: "FinTrack API Docs",
        version,
        description:
          "API for Telegram bot and web dashboard of financial accounting",
      },
      servers: [
        {
          url: ENV.SWAGGER_SERVER_URL ?? `http://${ENV.HOST}:${ENV.PORT}/api`,
          description: "FinTrack REST API",
        },
      ],
      tags: [
        {
          name: "Auth",
          description: "Authentication and operations with JWT tokens",
        },
        {
          name: "User",
          description: "User-related operations",
        },
        {
          name: "Transaction",
          description: "Financial transaction management",
        },
        {
          name: "Summary",
          description: "Receiving financial reports and summaries",
        },
        {
          name: "AI",
          description: "Integration with artificial intelligence for analysis",
        },
        {
          name: "User API Keys",
          description: "Manage per-user AI provider API keys",
        },
        {
          name: "Donation",
          description: "Donation checkout, webhook and leaderboard",
        },
        {
          name: "Admin",
          description: "Administration and runtime error management",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: [
      isDev
        ? path.join(rootDir, "src/docs/definitions/**/*.yml")
        : path.join(rootDir, "dist/docs/definitions/**/*.yml"),
      isDev
        ? path.join(rootDir, "src/modules/**/*.ts")
        : path.join(rootDir, "dist/modules/**/*.js"),
    ],
  };

  return swaggerJsdoc(options);
}

const staticSpec = !isDev ? getSpec() : null;

export function swaggerDocs(app: Express) {
  if (ENV.NODE_ENV === "production" && !ENV.ENABLE_SWAGGER_IN_PROD) {
    return;
  }

  const getCurrentSpec = () => (isDev ? getSpec() : staticSpec!);

  // Swagger page
  app.use(
    "/api-docs",
    swaggerUi.serve as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ((req: Request, res: Response, next: NextFunction) => {
      swaggerUi.setup(getCurrentSpec(), {
        customSiteTitle: "FinTrack API Docs",
        swaggerOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          operationsSorter: (a: any, b: any) => {
            const order: Record<string, number> = {
              get: 0,
              post: 1,
              patch: 2,
              put: 3,
              delete: 4,
              head: 5,
              options: 6,
              connect: 7,
              trace: 8,
            };

            const methodA = (a?.get?.("method") as string) ?? "";
            const methodB = (b?.get?.("method") as string) ?? "";
            const pathA = (a?.get?.("path") as string) ?? "";
            const pathB = (b?.get?.("path") as string) ?? "";

            return (
              (order[methodA] ?? 99) - (order[methodB] ?? 99) ||
              pathA.localeCompare(pathB)
            );
          },
        },
      })(req, res, next);
    }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  // Docs in JSON format
  app.get("/api-docs.json", (req: Request, res: Response) => {
    res.status(200).json(getCurrentSpec());
  });
}
