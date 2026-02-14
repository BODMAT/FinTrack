import bcrypt from "bcrypt";
import { AuthType, TransactionType } from "@prisma/client";
import { prisma } from "./client.js";

(async () => {
	try {
		await prisma.$connect();

		console.log("🌱 Seeding database...");

		const password = "11111111";
		const saltRounds = 10;

		const user1 = await prisma.user.create({
			data: {
				name: "Макар",
				photo_url: "https://picsum.photos/200/200?1",
				authMethods: {
					create: {
						type: AuthType.EMAIL,
						email: "makar@gmail.com",
						password_hash: await bcrypt.hash(password, saltRounds),
					},
				},
			},
		});

		const user2 = await prisma.user.create({
			data: {
				name: "Богдан",
				photo_url: "https://picsum.photos/200/200?2",
				authMethods: {
					create: {
						type: AuthType.TELEGRAM,
						telegram_id: "1234567890",
					},
				},
			},
		});

		const _t1 = await prisma.transaction.create({
			data: {
				title: "Зарплата",
				type: TransactionType.INCOME,
				amount: 25000,
				userId: user1.id,
				location: {
					create: {
						latitude: 50.4501,
						longitude: 30.5234,
					},
				},
			},
		});

		const _t2 = await prisma.transaction.create({
			data: {
				title: "Кафе",
				type: TransactionType.EXPENSE,
				amount: 350,
				userId: user1.id,
				location: {
					create: {
						latitude: 50.4547,
						longitude: 30.5166,
					},
				},
			},
		});

		const _t3 = await prisma.transaction.create({
			data: {
				title: "Фріланс",
				type: TransactionType.INCOME,
				amount: 12000,
				userId: user2.id,
			},
		});

		const _t4 = await prisma.transaction.create({
			data: {
				title: "Кіно",
				type: TransactionType.EXPENSE,
				amount: 200,
				userId: user2.id,
			},
		});

		console.log("✅ Seeding finished successfully!");
	} catch (err) {
		console.error("❌ Error while seeding database:", err);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
})();
