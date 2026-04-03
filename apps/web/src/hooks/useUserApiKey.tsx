import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getUserApiKeys,
  upsertUserApiKey,
  deleteUserApiKey,
  toggleUserApiKey,
} from "@/api/userApiKey";
import { queryClient } from "@/api/queryClient";
import { useAuth } from "@/hooks/useAuth";

const QUERY_KEY = ["user-api-keys"];

export function useUserApiKey() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getUserApiKeys,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const upsert = useMutation({
    mutationFn: upsertUserApiKey,
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const remove = useMutation({
    mutationFn: deleteUserApiKey,
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const toggle = useMutation({
    mutationFn: toggleUserApiKey,
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const groqKey = query.data?.find((k) => k.provider === "GROQ");
  const geminiKey = query.data?.find((k) => k.provider === "GEMINI");

  return {
    keys: query.data ?? [],
    isLoading: query.isLoading,
    groqKey,
    geminiKey,
    hasActiveKey: !!(groqKey?.isActive || geminiKey?.isActive),
    upsert: upsert.mutateAsync,
    isUpserting: upsert.isPending,
    upsertError: upsert.error?.message,
    remove: remove.mutateAsync,
    toggle: toggle.mutateAsync,
  };
}
