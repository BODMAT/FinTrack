import { Suspense } from "react";
import { DashboardClient } from "./DashboardClient";
import { prefetchDashboardState } from "@/lib/server/prefetchProtected";

function DashboardFallback() {
  return (
    <div className="w-full">
      <div className="neo-panel mb-[24px] h-[84px] animate-pulse" />
      <div className="mb-[24px] grid grid-cols-4 gap-[18px] max-[1320px]:grid-cols-2 max-[720px]:grid-cols-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="neo-panel h-[178px] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-[18px] max-[1100px]:grid-cols-1">
        <div className="neo-panel h-[470px] animate-pulse" />
        <div className="neo-panel h-[470px] animate-pulse" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const initialData = await prefetchDashboardState();

  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}
