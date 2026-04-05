import {
  dehydrate,
  QueryClient,
  type DehydratedState,
} from "@tanstack/react-query";
import {
  getAIHistoryServer,
  getChartDataServer,
  getMeServer,
  getSummaryServer,
  getTransactionsServer,
  getUserApiKeysServer,
} from "./api";
import type { TransactionsListResponse } from "@fintrack/types";

function createServerQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        retry: false,
      },
    },
  });
}

async function prefetchUser(queryClient: QueryClient) {
  try {
    const user = await getMeServer();
    queryClient.setQueryData(["user", "me"], user);
    return user;
  } catch {
    return null;
  }
}

export async function prefetchDashboardState(): Promise<DehydratedState> {
  const queryClient = createServerQueryClient();
  const user = await prefetchUser(queryClient);

  if (user) {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ["transactions", "all", user.id],
        queryFn: () => getTransactionsServer(),
      }),
      queryClient.prefetchQuery({
        queryKey: ["transactions", "summary"],
        queryFn: getSummaryServer,
      }),
      queryClient.prefetchQuery({
        queryKey: ["transactions", "summary", "chart", "all"],
        queryFn: () => getChartDataServer("all"),
      }),
    ]);
  }

  return dehydrate(queryClient);
}

export async function prefetchTransactionsState(): Promise<DehydratedState> {
  const queryClient = createServerQueryClient();
  const user = await prefetchUser(queryClient);

  if (user) {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ["transactions", "all", user.id],
        queryFn: () => getTransactionsServer(),
      }),
      queryClient.prefetchInfiniteQuery({
        queryKey: ["transactions", "infinite", 10, user.id],
        queryFn: ({ pageParam = 1 }) =>
          getTransactionsServer({ page: pageParam as number, perPage: 10 }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: TransactionsListResponse) => {
          if (!lastPage.pagination) return undefined;
          const { page, totalPages } = lastPage.pagination;
          return page < totalPages ? page + 1 : undefined;
        },
      }),
    ]);
  }

  return dehydrate(queryClient);
}

export async function prefetchAnalyticsState(): Promise<DehydratedState> {
  const queryClient = createServerQueryClient();
  const user = await prefetchUser(queryClient);

  if (user) {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ["transactions", "all", user.id],
        queryFn: () => getTransactionsServer(),
      }),
      queryClient.prefetchQuery({
        queryKey: ["AI_History", user.id],
        queryFn: getAIHistoryServer,
      }),
      queryClient.prefetchQuery({
        queryKey: ["user-api-keys"],
        queryFn: getUserApiKeysServer,
      }),
    ]);
  }

  return dehydrate(queryClient);
}
