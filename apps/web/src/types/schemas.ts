import z from "zod";

export const TransactionSchema = z.object({
	id: z.string(),
	userId: z.string(),
	title: z.string(),
	created_at: z.string().datetime(),
	type: z.enum(["EXPENSE", "INCOME"]),
	amount: z.string().refine((val) => !isNaN(Number(val)), {
		message: "amount must be a number string",
	}),
	location: z
		.object({
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180),
		})
		.optional(),
});

export const PaginationSchema = z.object({
	page: z.number(),
	perPage: z.number(),
	total: z.number(),
	totalPages: z.number(),
});

export const TransactionsResponseSchema = z.object({
	data: z.array(TransactionSchema).nullable(),
	pagination: PaginationSchema,
});
