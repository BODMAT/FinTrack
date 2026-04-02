import { Suspense } from "react";
import { Spinner } from "@/shared/ui/Helpers";
import { TransactionsClient } from "./TransactionsClient";

export default function TransactionsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <TransactionsClient />
    </Suspense>
  );
}
