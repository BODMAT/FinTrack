import { TransactionType } from "@prisma/client";
import { prisma } from "./client.js";

(async () => {
	try {
		await prisma.$connect();

		console.log("🌱 Seeding database...");

		const user1 = await prisma.user.create({
			data: {
				tg_id: "10001",
				tg_nickname: "makar_backend",
				name: "Макар",
				photo_url: "https://picsum.photos/200/200?1",
			},
		});

		const user2 = await prisma.user.create({
			data: {
				tg_id: "10002",
				tg_nickname: "bogdan_frontend",
				name: "Богдан",
				photo_url: "https://picsum.photos/200/200?2",
			},
		});

		const t1 = await prisma.transaction.create({
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

		const t2 = await prisma.transaction.create({
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

		const t3 = await prisma.transaction.create({
			data: {
				title: "Фріланс",
				type: TransactionType.INCOME,
				amount: 12000,
				userId: user2.id,
			},
		});

		const t4 = await prisma.transaction.create({
			data: {
				title: "Кіно",
				type: TransactionType.EXPENSE,
				amount: 200,
				userId: user2.id,
			},
		});

		console.log("✅ Seeding finished!");
	} catch (err) {
		console.error("❌ Error while seeding database:", err);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
})();