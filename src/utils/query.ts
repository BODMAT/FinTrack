import { queryClient } from "../api/queryClient";
import { useUserStore } from "../store/user";
import type { IData } from "../types/custom";

export function getUserDataById(dataId: number): IData | undefined {
    const userId = useUserStore.getState().userId;
    if (!userId) return undefined;
    const data = queryClient.getQueryData<IData[]>(["userData", userId]);
    return data?.find(item => item.id === dataId);
}

export function changeDataById(dataId: number, newData: IData, isNewOrChange: boolean = false): void {
    const userId = useUserStore.getState().userId;
    if (!userId) return;

    let data = queryClient.getQueryData<IData[]>(["userData", userId]) || [];

    if (isNewOrChange) {
        data = [...data, newData];
    } else {
        data = data.map(item => item.id === dataId ? newData : item);
    }

    queryClient.setQueryData(["userData", userId], data);
}

export function deleteDataById(dataId: number): void {
    const userId = useUserStore.getState().userId;
    if (!userId) return;

    const data = queryClient.getQueryData<IData[]>(["userData", userId]) || [];
    queryClient.setQueryData(["userData", userId], data.filter(item => item.id !== dataId));

}
