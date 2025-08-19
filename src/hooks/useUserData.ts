import { useQuery } from "@tanstack/react-query";
import { getDataByUserId } from "../api/data";
import { useUserStore } from "../store/user";

export function useUserData() {
    const userId = useUserStore((s) => s.userId);
    return useQuery({
        queryKey: ["userData", userId],
        queryFn: () => getDataByUserId(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60,
    });
}