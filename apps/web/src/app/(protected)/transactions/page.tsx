import { Suspense } from "react";
import { Spinner } from "@/shared/ui/Helpers";
import { TransactionsClient } from "./TransactionsClient";
import { prefetchTransactionsState } from "@/lib/server/prefetchProtected";

export default async function TransactionsPage() {
  const initialData = await prefetchTransactionsState();

  return (
    <Suspense fallback={<Spinner />}>
      <TransactionsClient initialData={initialData} />
    </Suspense>
  );
}
