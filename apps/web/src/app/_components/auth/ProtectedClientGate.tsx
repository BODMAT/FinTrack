"use client";

import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/shared/ui/Helpers";

export function ProtectedClientGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  return <>{children}</>;
}
