"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/api/queryClient";
import { SessionProvider } from "next-auth/react";
import { NEXT_AUTH_BASE_PATH } from "@/config/constants";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      basePath={NEXT_AUTH_BASE_PATH}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
