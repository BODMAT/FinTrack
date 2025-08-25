import dotenv from "dotenv";
import express from "express";
import type { Express, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

dotenv.config();

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 8000;

const app: Express = express();
const prisma = new PrismaClient();

async function main() {
	await prisma.$connect();

	app.get("/", (req: Request, res: Response) => {
		res.send("Hello, world!");
	});

	app.listen(PORT, () => {
		console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
	});
}

main()
	.catch((e) => {
		console.error('Error starting app:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});