"use client";

import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/shared/ui/Helpers";
import { useSession } from "next-auth/react";

export function ProtectedClientGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const { status, data: session } = useSession();

  const shouldWaitForOAuth =
    status === "loading" ||
    (status === "authenticated" && Boolean(session?.googleIdToken) && !user);
  if (isLoading || shouldWaitForOAuth) {
    return <Spinner />;
  }

  return <>{children}</>;
}
