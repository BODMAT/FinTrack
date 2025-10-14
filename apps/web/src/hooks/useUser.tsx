import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IUser, IData, CustomDate } from "../types/custom";
import { getUserByNickAndPass, getTransaction, changeTransaction, deleteTransaction } from "../api/userData";
import { memoizedGroupData } from "../utils/data.helpers";

export function useUser() {
    const queryClient = useQueryClient();

    const { data: currentUser, isLoading: isUserLoading } = useQuery<IUser | null>({
        queryKey: ["currentUser"],
        queryFn: async () => {
            const saved = localStorage.getItem("currentUser");
            return saved ? JSON.parse(saved) as IUser : null;
        },
        initialData: null,
    });

    const transactionsQuery = useQuery<IData[]>({
        queryKey: ["transactions"],
        queryFn: async () => {
            if (!currentUser?.nickname || !currentUser?.password) return [];
            const user = await getUserByNickAndPass(currentUser.nickname, currentUser.password);
            return user.data ?? [];
        },
        enabled: !!currentUser,
    });

    const loginMutation = useMutation<IUser, Error, { nickname: string; password: string }>({
        mutationFn: ({ nickname, password }) => getUserByNickAndPass(nickname, password),
        onSuccess: (userData) => {
            localStorage.setItem("currentUser", JSON.stringify(userData));
            queryClient.setQueryData(["currentUser"], userData);
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["infiniteUserData"] });
        },
    });

    const logout = () => {
        localStorage.removeItem("currentUser");
        queryClient.removeQueries({ queryKey: ["currentUser"] });
        queryClient.removeQueries({ queryKey: ["transactions"] });
        queryClient.removeQueries({ queryKey: ["infiniteUserData"] });
    };

    const getUserDataById = (dataId: string, options?: { enabled?: boolean }) => {
        return useQuery<IData | null>({
            queryKey: ["transaction", dataId],
            queryFn: async () => {
                const cachedTx = queryClient.getQueryData<IData[]>(["transactions"])?.find(tx => tx.id === dataId);
                if (cachedTx) return cachedTx;
                return await getTransaction(dataId);
            },
            staleTime: 1000 * 60 * 5,
            enabled: options?.enabled ?? true,
        });
    };

    const transactionMutation = useMutation<IData, Error, { dataId: string; newData: IData; isNewOrChange?: boolean }>({
        mutationFn: ({ dataId, newData, isNewOrChange }) => {
            return changeTransaction(dataId, newData, isNewOrChange)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["infiniteUserData"] });
        },
    });

    const deleteTransactionMutation = useMutation<void, Error, string>({
        mutationFn: deleteTransaction,
        onSuccess: (_, transactionId) => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.removeQueries({ queryKey: ["transaction", transactionId] });
            queryClient.invalidateQueries({ queryKey: ["infiniteUserData"] });
        },
    });

    const getCurrentRangeForChart = (range: CustomDate) => {
        if (!transactionsQuery.data) return null;
        return memoizedGroupData(transactionsQuery.data, range);
    }

    return {
        user: currentUser,
        transactions: transactionsQuery.data ?? [],
        isLoading: isUserLoading || transactionsQuery.isLoading,
        login: loginMutation.mutate,
        logout,
        getUserDataById,
        changeDataById: transactionMutation.mutate,
        changeDataByIdAsync: transactionMutation.mutateAsync,
        deleteDataById: deleteTransactionMutation.mutate,
        deleteDataByIdAsync: deleteTransactionMutation.mutateAsync,

        getCurrentRangeForChart,

        error: loginMutation.error,
    };
}
