import api from "./api";
import { handleRequest } from "../utils/api";
import {
  type AIRequest,
  type AIResponse,
  AIResponseSchema,
} from "@fintrack/types";

export const getAIResponse = async ({
  data,
  prompt,
  model = "openai/gpt-oss-120b:cerebras",
}: AIRequest): Promise<AIResponse> => {
  const important =
    "Проаналізуй промпт та дані та дай конкретну відповідь на запитання на тій мові яка буде далі в промпті (якщо англ — то на англ очікую відповідь). Ще НЕ роби НІЯКИХ ТАБЛИЦЬ чи виділень тексту (жирним чи іншим) чи формул - відповідь коротким абзацом тексту. Дозволяються смайли, небагато. Далі дані для аналізу = ";
  return handleRequest(
    api.post("/ai", { data, prompt: important + prompt, model }),
    AIResponseSchema,
  );
};
