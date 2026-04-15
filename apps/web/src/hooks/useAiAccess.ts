import { useQuery } from "@tanstack/react-query";
import { getAIAccess } from "@/api/ai";
import { useAuth } from "./useAuth";

export function useAiAccess() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ai-access", user?.id],
    queryFn: getAIAccess,
    enabled: !!user,
  });
}
