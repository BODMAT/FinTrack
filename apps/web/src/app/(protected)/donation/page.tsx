import { Suspense } from "react";
import { DonationClient } from "./DonationClient";
import { Spinner } from "@/shared/ui/Helpers";

export default function DonationPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DonationClient />
    </Suspense>
  );
}
