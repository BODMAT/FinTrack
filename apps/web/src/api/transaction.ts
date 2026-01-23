import { handleRequest } from "../utils/api";
import api from "./api";
import {
	responseTransactionSchema,
	transactionsListResponseSchema,
	type CreateTransaction,
	type Pagination,
	type ResponseTransaction,
	type TransactionsListResponse,
	type UpdateTransaction,
} from "../types/transaction";

export const getTransactions = async (
	payload: Pagination,
): Promise<TransactionsListResponse> => {
	return handleRequest(
		api.get("/transactions", { params: payload }),
		transactionsListResponseSchema,
	);
};

export const getTransactionById = async (
	id: string,
): Promise<ResponseTransaction> => {
	return handleRequest(
		api.get(`/transactions/${id}`),
		responseTransactionSchema,
	);
};

export const createTransaction = async (
	payload: CreateTransaction,
): Promise<ResponseTransaction> => {
	return handleRequest(
		api.post("/transactions", payload),
		responseTransactionSchema,
	);
};

export const updateTransaction = async (
	id: string,
	payload: UpdateTransaction,
): Promise<ResponseTransaction> => {
	return handleRequest(
		api.patch(`/transactions/${id}`, payload),
		responseTransactionSchema,
	);
};

export const deleteTransaction = async (id: string): Promise<void> => {
	return handleRequest(api.delete(`/transactions/${id}`));
};
