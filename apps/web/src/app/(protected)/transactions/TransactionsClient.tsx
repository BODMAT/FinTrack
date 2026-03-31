"use client";

import { Transactions } from "./_components/Transactions";
import { ProtectedClientGate } from "@/app/_components/auth/ProtectedClientGate";

export function TransactionsClient() {
  return (
    <ProtectedClientGate>
      <Transactions />
    </ProtectedClientGate>
  );
}
