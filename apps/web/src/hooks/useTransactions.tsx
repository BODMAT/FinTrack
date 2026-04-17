import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
  createTransaction,
  deleteMonobankTransactions,
  deleteTransaction,
  fetchMonobankAccounts,
  fetchMonobankTransactions,
  getTransactionById,
  getTransactions,
  importMonobankTransactions,
  updateTransaction,
} from "@/api/transaction";
import type {
  CreateTransaction,
  TransactionsListResponse,
  UpdateTransaction,
} from "@fintrack/types";
import { queryClient } from "@/api/queryClient";
import type {
  MonobankFetchPayload,
  MonobankImportPayload,
  TransactionSource,
} from "@/types/monobank";

interface UseTransactionsProps {
  perPage: number;
  userId?: string;
  source?: TransactionSource;
}

export const useTransactionsInfinite = ({
  perPage,
  userId,
  source,
}: UseTransactionsProps) => {
  return useInfiniteQuery({
    queryKey: ["transactions", "infinite", perPage, userId, source],
    queryFn: ({ pageParam = 1 }) =>
      getTransactions({ page: pageParam, perPage, source }),
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
  source?: TransactionSource;
  enabled?: boolean;
}

export const useTransactionsAll = ({
  userId,
  source,
  enabled = true,
}: UseTransactionsAllProps) => {
  return useQuery({
    queryKey: ["transactions", "all", userId, source],
    queryFn: ({ signal }) => getTransactions({ source }, signal),
    enabled: !!userId && enabled,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTransactionMutations = () => {
  const createMutation = useMutation({
    mutationFn: (payload: CreateTransaction) => createTransaction(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTransaction }) =>
      updateTransaction(id, payload),
    onSettled: () => {
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

export const useMonobankMutations = () => {
  const accountsMutation = useMutation({
    mutationFn: ({ token }: { token: string }) =>
      fetchMonobankAccounts({ token }),
  });

  const fetchMutation = useMutation({
    mutationFn: (payload: MonobankFetchPayload) =>
      fetchMonobankTransactions(payload),
  });

  const importMutation = useMutation({
    mutationFn: (payload: MonobankImportPayload) =>
      importMonobankTransactions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "summary"] });
    },
  });

  const deleteMonobankMutation = useMutation({
    mutationFn: () => deleteMonobankTransactions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "summary"] });
    },
  });

  return {
    fetchMonobankAccountsData: accountsMutation.mutateAsync,
    isFetchingMonobankAccounts: accountsMutation.isPending,
    fetchMonobankAccountsError: accountsMutation.error?.message,

    fetchMonobankData: fetchMutation.mutateAsync,
    isFetchingMonobankData: fetchMutation.isPending,
    fetchMonobankError: fetchMutation.error?.message,

    importMonobankData: importMutation.mutateAsync,
    isImportingMonobankData: importMutation.isPending,
    importMonobankError: importMutation.error?.message,

    deleteMonobankData: deleteMonobankMutation.mutateAsync,
    isDeletingMonobankData: deleteMonobankMutation.isPending,
    deleteMonobankError: deleteMonobankMutation.error?.message,
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
