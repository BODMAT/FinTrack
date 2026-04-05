import { cookies } from "next/headers";
import {
  AllSummarySchema,
  MessageFromDBSchema,
  type IChartData,
  type ISummary,
  type MessageFromDB,
  type Range,
  type TransactionsListResponse,
  type UserResponse,
  UserApiKeysSchema,
  UserResponseSchema,
  transactionsListResponseSchema,
  ChartDataSchema,
} from "@fintrack/types";
import type { ZodSchema } from "zod";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function serverApiGet<T>(
  path: string,
  schema: ZodSchema<T>,
  searchParams?: URLSearchParams,
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const url =
    `${API_BASE_URL}${path}` +
    (searchParams && searchParams.toString()
      ? `?${searchParams.toString()}`
      : "");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const rawData: unknown = await response.json();
  const parsed = schema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error("Server response validation failed");
  }

  return parsed.data;
}

export async function getMeServer(): Promise<UserResponse> {
  return serverApiGet("/users/me", UserResponseSchema);
}

export async function getTransactionsServer(params?: {
  page?: number;
  perPage?: number;
}): Promise<TransactionsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.perPage) searchParams.set("perPage", String(params.perPage));
  return serverApiGet(
    "/transactions",
    transactionsListResponseSchema,
    searchParams,
  );
}

export async function getSummaryServer(): Promise<ISummary> {
  return serverApiGet("/summary", AllSummarySchema);
}

export async function getChartDataServer(range: Range): Promise<IChartData> {
  const searchParams = new URLSearchParams({ range });
  return serverApiGet("/summary/chart", ChartDataSchema, searchParams);
}

export async function getAIHistoryServer(): Promise<MessageFromDB[]> {
  return serverApiGet("/ai/history", MessageFromDBSchema.array());
}

export async function getUserApiKeysServer() {
  return serverApiGet("/user-api-keys", UserApiKeysSchema);
}
