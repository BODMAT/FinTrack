import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IUser, IData, CustomDate, MoneyType } from "../types/custom";
import { getUserByNickAndPass } from "../api/userData";
import { getUserDataWithStats } from "../utils/data.helpers";

const emptyUser: IUser = {
    nickname: null,
    password: null,
    userName: null,
    userPhoto: null,
    data: null,
};

export function useUser() {
    const queryClient = useQueryClient();

    const { data: user = emptyUser, isLoading, error } = useQuery<IUser>({
        queryKey: ["currentUser"],
        queryFn: () => emptyUser,
        staleTime: Infinity,
    });

    // login mutation
    const loginMutation = useMutation({
        mutationFn: async ({ nickname, password }: { nickname: string; password: string }) =>
            await getUserByNickAndPass(nickname, password),
        onSuccess: (data) => queryClient.setQueryData(["currentUser"], data),
    });

    // logout
    const logout = () => {
        queryClient.setQueryData(["currentUser"], emptyUser);
    };

    // get stats
    const getStats = (range: CustomDate, title: MoneyType) => {
        if (!user.data) return null;
        return getUserDataWithStats(user.data, range, title);
    };


    //! other methods (local now)
    const getUserDataById = (dataId: number): IData | undefined => {
        const currentUser = queryClient.getQueryData<IUser>(["currentUser"]);
        if (!currentUser?.data) return undefined;
        return currentUser.data.find((item) => item.id === dataId);
    };

    const changeDataById = (dataId: number, newData: IData, isNewOrChange: boolean = false): void => {
        const currentUser = queryClient.getQueryData<IUser>(["currentUser"]);
        if (!currentUser) return;

        let data = currentUser.data || [];

        if (isNewOrChange) {
            data = [...data, newData];
        } else {
            data = data.map((item) => (item.id === dataId ? newData : item));
        }

        queryClient.setQueryData(["currentUser"], { ...currentUser, data });
    };

    const deleteDataById = (dataId: number): void => {
        const currentUser = queryClient.getQueryData<IUser>(["currentUser"]);
        if (!currentUser?.data) return;

        const data = currentUser.data.filter((item) => item.id !== dataId);
        queryClient.setQueryData(["currentUser"], { ...currentUser, data });
    };

    return {
        user,
        isLoading,
        error,
        login: loginMutation.mutate,
        logout,
        getUserDataById,
        changeDataById,
        deleteDataById,
        getStats,
    };
}
