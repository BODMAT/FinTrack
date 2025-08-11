import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomDate, IData, MoneyType } from "../types/custom";
import { getDataByUserId } from "../api/data";
import { groupData, getTotalOfRange, getPercentageOfRangeIncrease } from "../utils/data.helpers";
import { simpleMemoize3 } from "../utils/other";

const memoizedGroupData = simpleMemoize3(groupData);
const memoizedGetTotalOfRange = simpleMemoize3(getTotalOfRange);
const memoizedGetPercentage = simpleMemoize3(getPercentageOfRangeIncrease);

export function useUserData(userId: number) {
    return useQuery({
        queryKey: ["userData", userId],
        queryFn: () => getDataByUserId(userId),
        staleTime: 1000 * 60,
    });
}

export function useUserDataById(userId: number, dataId: number) {
    const queryClient = useQueryClient();
    const data = queryClient.getQueryData<IData[]>(["userData", userId]);
    return data?.find(item => item.id === dataId);
}

export function useUserDataWithStats(userId: number, range: CustomDate, title: MoneyType) {
    const queryClient = useQueryClient();
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