import z from "zod";

const locationSchema = z.object({
	latitude: z.coerce.number().min(-90).max(90),
	longitude: z.coerce.number().min(-180).max(180),
});

export const createTransactionSchema = z.object({
	title: z.string().min(1).max(50),
	type: z.enum(["INCOME", "EXPENSE"]),
	amount: z.coerce.number().positive(),
	created_at: z.coerce.date().optional(),
	updated_at: z.coerce.date().optional(),
	location: locationSchema.nullish(),
});

export const updateTransactionSchema = z.object({
	title: z.string().min(1).max(50).optional(),
	type: z.enum(["INCOME", "EXPENSE"]).optional(),
	amount: z.coerce.number().positive().optional(),
	created_at: z.coerce.date().optional(),
	updated_at: z.coerce.date().optional(),
	location: locationSchema.nullish(),
});

export const responseTransactionSchema = createTransactionSchema.extend({
	id: z.string().uuid(),
});

export const transactionsListResponseSchema = z.object({
	data: z.array(responseTransactionSchema),
	pagination: z
		.object({
			page: z.number(),
			perPage: z.number(),
			total: z.number(),
			totalPages: z.number(),
		})
		.optional(),
});

export const paginationSchema = z
	.object({
		page: z.coerce.number().int().positive().optional(),
		perPage: z.coerce.number().int().positive().optional(),
	})
	.refine(
		(data) => (data.page === undefined) === (data.perPage === undefined),
		{
			message:
				"Both page and perPage must be provided together, or neither.",
		},
	);

export const formTransactionSchema = createTransactionSchema
	.omit({ location: true })
	.extend({
		amount: z.string().min(1, "Amount is required"),

		latitude: z.string().optional(),
		longitude: z.string().optional(),
	});

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type ResponseTransaction = z.infer<typeof responseTransactionSchema>;
export type TransactionsListResponse = z.infer<
	typeof transactionsListResponseSchema
>;
export type Pagination = z.infer<typeof paginationSchema>;
export type FormTransaction = z.infer<typeof formTransactionSchema>;
