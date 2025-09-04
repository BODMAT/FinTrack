import { useInfiniteQuery } from "@tanstack/react-query";
import { useUser } from "./useUser";
import { getUserByNickAndPass } from "../api/userData";
import type { IData } from "../types/custom";

export function useInfinityUserData(perPage: number = 10) {
    const { user: currentUser } = useUser();

    const query = useInfiniteQuery<{ data: IData[] }, Error>({
        queryKey: ["infiniteUserData", currentUser?.nickname],
        enabled: !!currentUser,
        queryFn: async ({ pageParam = 1 }) => {
            if (!currentUser?.nickname || !currentUser.password)
                throw new Error("User not logged in");

            const result = await getUserByNickAndPass(
                currentUser.nickname,
                currentUser.password,
                pageParam as number,
                perPage
            );

            return { data: result.data ?? [] };
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage.data || lastPage.data.length < perPage) return undefined;
            return lastPage.data.length === perPage ? (lastPage.data.length / perPage + 1) : undefined;
        },
        initialPageParam: 1,
    });

    const flatData = query.data?.pages.flatMap(page => page.data) ?? [];

    return { ...query, data: flatData };
}


