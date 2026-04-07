"use client";

import { ProtectedClientGate } from "@/app/_components/auth/ProtectedClientGate";
import { Monobank } from "./_components/Monobank";

export function MonobankClient() {
  return (
    <ProtectedClientGate>
      <Monobank />
    </ProtectedClientGate>
  );
}
