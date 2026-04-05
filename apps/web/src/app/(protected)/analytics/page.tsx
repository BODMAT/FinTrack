import { Suspense } from "react";
import { AnalyticsClient } from "./AnalyticsClient";
import { Spinner } from "@/shared/ui/Helpers";
import { prefetchAnalyticsState } from "@/lib/server/prefetchProtected";

export default async function AnalyticsPage() {
  const initialData = await prefetchAnalyticsState();

  return (
    <Suspense fallback={<Spinner />}>
      <AnalyticsClient initialData={initialData} />
    </Suspense>
  );
}
