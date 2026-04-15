"use client";

import { ProtectedClientGate } from "@/app/_components/auth/ProtectedClientGate";
import { Donation } from "./_components/Donation";

export function DonationClient() {
  return (
    <ProtectedClientGate>
      <Donation />
    </ProtectedClientGate>
  );
}
