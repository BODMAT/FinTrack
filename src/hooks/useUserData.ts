import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomDate, IData, MoneyType } from "../types/custom";
import { getDataByUserId } from "../api/data";
import { groupData, getTotalOfRange, getPercentageOfRangeIncrease } from "../utils/data.helpers";
import { simpleMemoize3 } from "../utils/other";
import { useUserStore } from "../store/user";
import { queryClient } from "../api/queryClient";

const memoizedGroupData = simpleMemoize3(groupData);
const memoizedGetTotalOfRange = simpleMemoize3(getTotalOfRange);
const memoizedGetPercentage = simpleMemoize3(getPercentageOfRangeIncrease);

export function useUserData() {
    const userId = useUserStore((s) => s.userId);
    return useQuery({
        queryKey: ["userData", userId],
        queryFn: () => getDataByUserId(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60,
    });
}

export function useUserDataWithStats(range: CustomDate, title: MoneyType) {
    const queryClient = useQueryClient();
    const userId = useUserStore((s) => s.userId);
    const data = queryClient.getQueryData<IData[]>(["userData", userId]) || [];

    const currentRangeForChart = memoizedGroupData(data, range);
    const total = memoizedGetTotalOfRange(data, range, title);
    const percentage = memoizedGetPercentage(data, range, title);
    const balance = memoizedGetTotalOfRange(data, range, "balance");

    return {
        currentRangeForChart,
        total,
        percentage,
        balance,
    };
}