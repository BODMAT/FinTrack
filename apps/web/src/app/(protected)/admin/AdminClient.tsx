"use client";

import { ProtectedClientGate } from "@/app/_components/auth/ProtectedClientGate";
import { AdminPanel } from "./_components/AdminPanel";

export function AdminClient() {
  return (
    <ProtectedClientGate>
      <AdminPanel />
    </ProtectedClientGate>
  );
}
