"use client";

import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/shared/ui/Helpers";
import { useSession } from "next-auth/react";

export function ProtectedClientGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();
  const { status } = useSession();

  const shouldWaitForOAuth = status === "loading";
  if (isLoading || shouldWaitForOAuth) {
    return <Spinner />;
  }

  return <>{children}</>;
}
