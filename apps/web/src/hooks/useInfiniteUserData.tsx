import { useInfiniteQuery } from "@tanstack/react-query";
import { useUser } from "./useUser";
import { getUserByNickAndPass } from "../api/userData";

export function useInfinityUserData(perPage: number = 10) {
    const { user: currentUser } = useUser();

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ["infiniteUserData"],
        enabled: !!currentUser?.nickname && !!currentUser?.password,
        staleTime: Infinity, //! local now
        queryFn: async ({ pageParam = 1 }) => {
            if (!currentUser?.nickname || !currentUser.password) throw new Error("User not logged in");
            return getUserByNickAndPass(currentUser.nickname, currentUser.password, pageParam, perPage);
        },

        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.data || lastPage.data.length < perPage) return undefined;
            return allPages.length + 1;
        },
        initialPageParam: 1,
        select: (data) => data.pages.flatMap((page) => page.data),
    })

    return { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage }
}
