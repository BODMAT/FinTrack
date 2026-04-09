"use client";

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { Transactions } from "./_components/Transactions";
import { ProtectedClientGate } from "@/app/_components/auth/ProtectedClientGate";

interface TransactionsClientProps {
  initialData?: DehydratedState | null;
}

export function TransactionsClient({
  initialData = null,
}: TransactionsClientProps) {
  return (
    <ProtectedClientGate>
      <HydrationBoundary state={initialData ?? undefined}>
        <Transactions />
      </HydrationBoundary>
    </ProtectedClientGate>
  );
}
