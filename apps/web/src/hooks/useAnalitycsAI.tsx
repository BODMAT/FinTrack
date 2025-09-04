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

    // optimistic update
    const changeResponseToOld = useMutation<AIState, Error, { id: string }, { previousData: AIState }>({
        mutationFn: async ({ id }) => {
            if (!data || !data?.response) {
                throw new Error('Data is not available');
            }
            const updatedData: AIState = { ...data, response: data?.response?.map(item => item.id === id ? { ...item, isNew: false } : item) };
            return updatedData;
        },

        onMutate: async ({ id }) => {
            await queryClient.cancelQueries({ queryKey: ["AI"] });
            const previousData = queryClient.getQueryData<AIState>(["AI"]);

            queryClient.setQueryData<AIState>(["AI"], (old) => {
                if (!old || !old.response) return old as AIState;
                return {
                    ...old,
                    response: old.response.map((item) =>
                        item.id === id ? { ...item, isNew: false } : item
                    ),
                };
            });

            localStorage.setItem("AI", JSON.stringify(queryClient.getQueryData(["AI"])));

            return previousData ? { previousData } : { previousData: emptyAI }
        },

        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["AI"], context.previousData);
                localStorage.setItem("AI", JSON.stringify(context.previousData));
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["AI"],
            })
        },
    });

    return { data, isLoading: getResponse.status === "pending", getResponse: getResponse.mutate, changeResponseToOld: changeResponseToOld.mutate };
}