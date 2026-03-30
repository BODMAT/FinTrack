"use client";

import dynamic from "next/dynamic";
import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { Dashboard } from "../../../features/dashboard/ui/Dashboard";

const IncomeOutcomeMapClientOnly = dynamic(
  () =>
    import("../../../features/dashboard/ui/IncomeOutcomeMap").then(
      (module) => module.IncomeOutcomeMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[450px] rounded-[10px] border-1 border-[var(--color-fixed-text)]" />
    ),
  },
);

interface DashboardClientProps {
  initialData?: DehydratedState | null;
}

export function DashboardClient({ initialData = null }: DashboardClientProps) {
  return (
    <HydrationBoundary state={initialData ?? undefined}>
      <Dashboard MapComponent={IncomeOutcomeMapClientOnly} />
    </HydrationBoundary>
  );
}
