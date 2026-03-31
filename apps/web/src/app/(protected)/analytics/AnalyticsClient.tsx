"use client";

import { Analytics } from "./_components/Analytics";
import { ProtectedClientGate } from "@/app/_components/auth/ProtectedClientGate";

export function AnalyticsClient() {
  return (
    <ProtectedClientGate>
      <Analytics />
    </ProtectedClientGate>
  );
}
