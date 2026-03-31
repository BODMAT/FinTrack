import { Suspense } from "react";
import { AnalyticsClient } from "./AnalyticsClient";
import { Spinner } from "@/shared/ui/Helpers";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AnalyticsClient />
    </Suspense>
  );
}



