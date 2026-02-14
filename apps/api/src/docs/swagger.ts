import { ENV } from "../config/env.js";
import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const HOST = ENV.HOST;
const PORT = ENV.PORT;

const { version } = JSON.parse(
	fs.readFileSync(path.resolve("./package.json"), "utf-8"),
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
				url: `http://${HOST}:${PORT}/api`,
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
				description:
					"Integration with artificial intelligence for analysis",
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
	apis: ["./src/docs/definitions/**/*.yml", "./src/modules/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function swaggerDocs(app: Express) {
	// Swagger page
	app.use(
		"/api-docs",
		swaggerUi.serve,
		swaggerUi.setup(swaggerSpec, {
			customSiteTitle: "FinTrack API Docs",
			swaggerOptions: {
				operationsSorter: (a: any, b: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
		}),
	);

	// Docs in JSON format
	app.use("/api-docs.json", (req: Request, res: Response) => {
		res.status(200).json(swaggerSpec);
	});
}
