"use client";

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { Analytics } from "./_components/Analytics";
import { ProtectedClientGate } from "@/app/_components/auth/ProtectedClientGate";

interface AnalyticsClientProps {
  initialData?: DehydratedState | null;
}

export function AnalyticsClient({ initialData = null }: AnalyticsClientProps) {
  return (
    <ProtectedClientGate>
      <HydrationBoundary state={initialData ?? undefined}>
        <Analytics />
      </HydrationBoundary>
    </ProtectedClientGate>
  );
}
