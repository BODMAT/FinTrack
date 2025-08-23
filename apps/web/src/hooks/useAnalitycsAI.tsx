import { useMutation, useQuery } from "@tanstack/react-query";
import type { AIState, Response } from "../types/custom";
import { useUser } from "./useUser";
import { analyzeData } from "../api/ai";
import { generateId } from "../utils/data.helpers";
import { queryClient } from "../api/queryClient";

const emptyAI: AIState = {
    prompt: '',
    response: null
}

export function useAnalitycsAI() {
    const { user } = useUser();
    const storedUser = localStorage.getItem("AI");
    const initialUser: AIState = storedUser ? JSON.parse(storedUser) : emptyAI;

    const { data } = useQuery<AIState>({
        queryKey: ["AI"],
        queryFn: () => (initialUser),
        staleTime: Infinity, //! local now
        enabled: !!user,
    })

    const getResponse = useMutation<AIState, Error, { prompt: string; model?: string }>({
        mutationFn: async ({ prompt, model }) => {
            const result: string = await analyzeData(user?.data || [], prompt, model);
            const responseObj: Response = { forPrompt: prompt, id: generateId(), isNew: true, content: result, date: new Date().toISOString() };
            return { ...data, prompt: data?.prompt || '', response: [...(data?.response || []), responseObj] };
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["AI"], data);
            localStorage.setItem("AI", JSON.stringify(data));
        },
    });

    const changeResponseToOld = useMutation<AIState, Error, { id: number }>({
        mutationFn: async ({ id }) => {
            if (!data || !data?.response) {
                throw new Error('Data is not available');
            }
            const updatedData: AIState = { ...data, response: data?.response?.map(item => item.id === id ? { ...item, isNew: false } : item) };
            return updatedData;
        },

        onSuccess: (data) => {
            queryClient.setQueryData(["AI"], data);
            localStorage.setItem("AI", JSON.stringify(data));
        },
    });

    return { data, isLoading: getResponse.status === "pending", getResponse: getResponse.mutate, changeResponseToOld: changeResponseToOld.mutate };
}