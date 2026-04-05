"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { exchangeGoogleSession } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { queryClient } from "@/api/queryClient";

export function OAuthBridge() {
  const { data: session, status } = useSession();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);
  const lastProcessedIdTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const idToken = session?.googleIdToken;
    if (!idToken) return;
    if (lastProcessedIdTokenRef.current === idToken) return;

    lastProcessedIdTokenRef.current = idToken;

    void (async () => {
      setBootstrapping(true);
      try {
        await exchangeGoogleSession(idToken);
        setAuthenticated(true);
        await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      } catch {
        await signOut({ redirect: false });
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [session?.googleIdToken, setAuthenticated, setBootstrapping, status]);

  return null;
}
