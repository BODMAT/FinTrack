import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import { getAllTransactions } from "../transaction/service.js";
import { groupData, getFullStats } from "./helpers.js";

// Data validation
const rangeSchema = z.enum(["day", "week", "month", "year", "all"]);

// Helpers
function convertToIData(transactionsData: Awaited<ReturnType<typeof getAllTransactions>>) {
	return transactionsData.data.map((t) => ({
		...t,
		amount: t.amount.toString(),
		created_at: t.created_at.toISOString(),
		updated_at: t.updated_at.toISOString(),
	}));
}

// Controllers
export async function getSummary(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = req.user?.id;
		if (!userId) throw new AppError("Unauthorized", 401);

		const transactions = await getAllTransactions(userId);
		const data = convertToIData(transactions);
		const summary = getFullStats(data);
		res.status(200).json(summary);
	} catch (err) {
		next(err);
	}
}

export async function getChartData(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = req.user?.id;
		if (!userId) throw new AppError("Unauthorized", 401);

		const parsed = rangeSchema.safeParse(req.query.range);
		if (!parsed.success) {
			throw new AppError(
				"Invalid range. Must be: day, week, month, year, all",
			);
		}
		const range = parsed.data;

		const transactions = await getAllTransactions(userId);
		const data = convertToIData(transactions);
		const chartData = groupData(data, range);
		res.status(200).json(chartData);
	} catch (err) {
		next(err);
	}
}
