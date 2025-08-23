import { useQuery, useMutation } from "@tanstack/react-query";
import type { IUser, IData, CustomDate, MoneyType } from "../types/custom";
import { getUserByNickAndPass } from "../api/userData";
import { getUserDataWithStats } from "../utils/data.helpers";
import { queryClient } from "../api/queryClient";

const emptyUser: IUser = {
    nickname: null,
    password: null,
    userName: null,
    userPhoto: null,
    data: null,
};

export function useUser() {

    const storedUser = localStorage.getItem("currentUser");
    const initialUser: IUser = storedUser ? JSON.parse(storedUser) : emptyUser;

    const { data: user = initialUser, isLoading, error } = useQuery<IUser>({
        queryKey: ["currentUser"],
        queryFn: () => initialUser,
        staleTime: Infinity, //! local now
    });

    // login mutation
    const loginMutation = useMutation<IUser, Error, { nickname: string; password: string }>({
        mutationFn: async ({ nickname, password }) => {
            return getUserByNickAndPass(nickname, password);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["currentUser"], data);
            localStorage.setItem("currentUser", JSON.stringify(data));
        },
    });

    // logout
    const logout = () => {
        queryClient.setQueryData(["currentUser"], emptyUser);
        localStorage.removeItem("currentUser");
    };

    // get stats
    const getStats = (range: CustomDate, title: MoneyType) => {
        if (!user.data) return null;
        return getUserDataWithStats(user.data, range, title);
    };

    //! other methods (local now)!!!!!
    const getUserDataById = (dataId: number): IData | undefined => {
        const currentUser = queryClient.getQueryData<IUser>(["currentUser"]);
        if (!currentUser?.data) return undefined;
        return currentUser.data.find((item) => item.id === dataId);
    };

    const changeDataById = (dataId: number, newData: IData, isNewOrChange: boolean = false) => {
        const currentUser = queryClient.getQueryData<IUser>(["currentUser"]);
        if (!currentUser) return;

        let data = currentUser.data || [];
        if (isNewOrChange) data = [...data, newData];
        else data = data.map((item) => (item.id === dataId ? newData : item));

        const updatedUser = { ...currentUser, data };
        queryClient.setQueryData(["currentUser"], updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        queryClient.setQueryData<any>(["infiniteUserData"], (oldData: any) => {
            if (!oldData) return oldData;
            const pages = oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((item: IData) =>
                    item.id === dataId ? newData : item
                ),
            }));
            if (isNewOrChange) {
                const lastPageIndex = pages.length - 1;
                pages[lastPageIndex] = {
                    ...pages[lastPageIndex],
                    data: [...pages[lastPageIndex].data, newData],
                };
            }
            return { ...oldData, pages };
        });
    };

    const deleteDataById = (dataId: number) => {
        const currentUser = queryClient.getQueryData<IUser>(["currentUser"]);
        if (!currentUser?.data) return;

        const data = currentUser.data.filter((item) => item.id !== dataId);
        const updatedUser = { ...currentUser, data };
        queryClient.setQueryData(["currentUser"], updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        queryClient.setQueryData<any>(["infiniteUserData"], (oldData: any) => {
            if (!oldData) return oldData;
            const pages = oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.filter((item: IData) => item.id !== dataId),
            }));
            return { ...oldData, pages };
        });
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
