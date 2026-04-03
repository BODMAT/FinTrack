import api from "./api";
import { handleRequest } from "@/utils/api";
import {
  type AIRequest,
  type AIResponse,
  AIResponseSchema,
} from "@fintrack/types";

export type MessageFromDB = {
  id: string;
  prompt: string;
  result: string;
  created_at?: string;
  gettedat?: string;
};

export const getAIResponse = async ({
  data,
  prompt,
  model = "llama-3.1-8b-instant",
}: AIRequest): Promise<AIResponse> => {
  return handleRequest(
    api.post("/ai", { data, prompt, model }),
    AIResponseSchema,
  );
};

export async function getAIHistory(): Promise<MessageFromDB[]> {
  return handleRequest<MessageFromDB[]>(api.get("/ai/history"));
}
