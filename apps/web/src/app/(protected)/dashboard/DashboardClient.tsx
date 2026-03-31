"use client";

import dynamic from "next/dynamic";
import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { Dashboard } from "./_components/Dashboard";
import { ProtectedClientGate } from "@/app/_components/auth/ProtectedClientGate";

const IncomeOutcomeMapClientOnly = dynamic(
  () =>
    import("./_components/IncomeOutcomeMap").then(
      (module) => module.IncomeOutcomeMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[450px] rounded-[10px] border border-(--color-fixed-text)" />
    ),
  },
);

interface DashboardClientProps {
  initialData?: DehydratedState | null;
}

export function DashboardClient({ initialData = null }: DashboardClientProps) {
  return (
    <ProtectedClientGate>
      <HydrationBoundary state={initialData ?? undefined}>
        <Dashboard MapComponent={IncomeOutcomeMapClientOnly} />
      </HydrationBoundary>
    </ProtectedClientGate>
  );
}
