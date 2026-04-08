import { Suspense } from "react";
import { AdminClient } from "./AdminClient";
import AdminLoading from "./loading";

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminClient />
    </Suspense>
  );
}
