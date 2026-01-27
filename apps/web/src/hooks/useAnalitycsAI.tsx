import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { AIRequest, AIResponseWithDiff } from "../types/ai";
import { getAIResponse } from "../api/ai";
import { queryClient } from "../api/queryClient";

export function useAnalitycsAI() {
	const { user } = useAuth();
	const queryKey = ["AI_History", user?.id];

	const { data: history = [] } = useQuery<AIResponseWithDiff[]>({
		queryKey,
		queryFn: () => {
			const saved = localStorage.getItem(`AI_history_${user?.id}`);
			return saved ? JSON.parse(saved) : [];
		},
		enabled: !!user,
		staleTime: Infinity,
	});

	const getResponse = useMutation<AIResponseWithDiff, Error, AIRequest>({
		mutationFn: async (params) => {
			const result = await getAIResponse(params);
			return {
				...result,
				getted_at: new Date(),
				prompt: params.prompt,
				id: crypto.randomUUID(),
			};
		},
		onSuccess: (newResponse) => {
			queryClient.setQueryData<AIResponseWithDiff[]>(
				queryKey,
				(old = []) => {
					const updatedHistory = [newResponse, ...old];

					localStorage.setItem(
						`AI_history_${user?.id}`,
						JSON.stringify(updatedHistory),
					);

					return updatedHistory;
				},
			);
		},
	});

	return {
		history,
		isLoading: getResponse.isPending,
		getResponse: getResponse.mutate,
	};
}
