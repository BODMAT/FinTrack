import { handleRequest } from "@/utils/api";
import api from "./api";
import {
  responseTransactionSchema,
  transactionsListResponseSchema,
  type CreateTransaction,
  type ResponseTransaction,
  type TransactionsListResponse,
  type UpdateTransaction,
} from "@fintrack/types";

import type { Pagination } from "@/types/transaction";
import type {
  MonobankAccountsResponse,
  MonobankFetchPayload,
  MonobankFetchResponse,
  MonobankImportPayload,
  MonobankImportResponse,
} from "@/types/monobank";
import {
  monobankAccountsResponseSchema,
  monobankFetchResponseSchema,
  monobankImportResponseSchema,
} from "@/types/monobank";

export const getTransactions = async (
  payload: Pagination,
  signal?: AbortSignal,
): Promise<TransactionsListResponse> => {
  return handleRequest(
    api.get("/transactions", { params: payload, signal }),
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

export const fetchMonobankTransactions = async (
  payload: MonobankFetchPayload,
): Promise<MonobankFetchResponse> => {
  return handleRequest(
    api.post("/transactions/monobank/fetch", payload),
    monobankFetchResponseSchema,
  );
};

export const fetchMonobankAccounts = async (payload: {
  token: string;
}): Promise<MonobankAccountsResponse> => {
  return handleRequest(
    api.post("/transactions/monobank/accounts", payload),
    monobankAccountsResponseSchema,
  );
};

export const importMonobankTransactions = async (
  payload: MonobankImportPayload,
): Promise<MonobankImportResponse> => {
  return handleRequest(
    api.post("/transactions/monobank/import", payload),
    monobankImportResponseSchema,
  );
};

export const deleteMonobankTransactions = async (): Promise<{
  deleted: number;
  source: "MONOBANK";
}> => {
  return handleRequest(api.delete("/transactions/monobank"));
};
