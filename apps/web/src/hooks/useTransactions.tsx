import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
	createTransaction,
	deleteTransaction,
	getTransactionById,
	getTransactions,
	updateTransaction,
} from "../api/transaction";
import type {
	CreateTransaction,
	TransactionsListResponse,
	UpdateTransaction,
} from "../types/transaction";
import { queryClient } from "../api/queryClient";

interface UseTransactionsProps {
	perPage: number;
	userId?: string;
}

export const useTransactionsInfinite = ({
	perPage,
	userId,
}: UseTransactionsProps) => {
	return useInfiniteQuery({
		queryKey: ["transactions", "infinite", perPage, userId],
		queryFn: ({ pageParam = 1 }) =>
			getTransactions({ page: pageParam, perPage }),
		initialPageParam: 1,
		getNextPageParam: (lastPage: TransactionsListResponse) => {
			if (!lastPage.pagination) return undefined;

			const { page, totalPages } = lastPage.pagination;
			return page < totalPages ? page + 1 : undefined;
		},
		enabled: !!userId,
		staleTime: 1000 * 60 * 5,
	});
};

interface UseTransactionsAllProps {
	userId?: string;
}

export const useTransactionsAll = ({ userId }: UseTransactionsAllProps) => {
	return useQuery({
		queryKey: ["transactions", "all", userId],
		queryFn: () => getTransactions({}),
		enabled: !!userId,
		staleTime: 1000 * 60 * 5,
	});
};

export const useTransactionMutations = () => {
	const createMutation = useMutation({
		mutationFn: (payload: CreateTransaction) => createTransaction(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteTransaction(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateTransaction;
		}) => updateTransaction(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	return {
		createTx: createMutation.mutateAsync,
		createTxErrorMessage: createMutation.error?.message,
		isCreating: createMutation.isPending,

		deleteTx: deleteMutation.mutateAsync,
		deleteTxErrorMessage: deleteMutation.error?.message,
		isDeleting: deleteMutation.isPending,

		updateTx: updateMutation.mutateAsync,
		updateTxErrorMessage: updateMutation.error?.message,
		isUpdating: updateMutation.isPending,
	};
};

interface UseTransactionProps {
	id?: string;
	enabled?: boolean;
}

export const useTransaction = ({ id, enabled = true }: UseTransactionProps) => {
	return useQuery({
		queryKey: ["transactions", "detail", id],

		queryFn: () => {
			if (!id) throw new Error("ID is required");
			return getTransactionById(id);
		},

		enabled: !!id && enabled,

		staleTime: 1000 * 60 * 5,
	});
};
