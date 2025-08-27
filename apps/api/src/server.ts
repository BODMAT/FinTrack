import dotenv from "dotenv";
import { app } from "./app.js";
import { prisma } from "./prisma/client.js";

dotenv.config();

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 8000;

async function main() {
	try {
		await prisma.$connect();

		app.listen(PORT, () => {
			console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
		});
	} catch (err) {
		console.error("Error starting app:", err);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();