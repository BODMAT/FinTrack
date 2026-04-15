import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { AIResponseWithDiff } from "@/types/ai";
import type { AIRequest } from "@fintrack/types";
import { getAIResponse, getAIHistory } from "@/api/ai";
import { queryClient } from "@/api/queryClient";

export function useAnalyticsAI() {
  const { user } = useAuth();
  const queryKey = ["AI_History", user?.id];

  const { data: rawHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey,
    queryFn: () => getAIHistory(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const history = useMemo<AIResponseWithDiff[]>(
    () =>
      rawHistory.map((msg) => {
        const rawDate = msg.created_at ?? msg.gettedat;
        const parsedDate = rawDate ? new Date(rawDate) : new Date();
        const safeDate = Number.isFinite(parsedDate.getTime())
          ? parsedDate
          : new Date();
        return {
          id: msg.id,
          model: "llama-3.1-8b-instant",
          result: msg.result,
          prompt: msg.prompt,
          getted_at: safeDate,
        };
      }),
    [rawHistory],
  );

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
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["ai-access"] }),
      ]);
    },
  });

  return {
    history,
    isHistoryLoading,
    isLoading: getResponse.isPending,
    getResponse: getResponse.mutateAsync,
  };
}
