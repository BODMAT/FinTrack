"use client";

import { useEffect, useRef } from "react";
import { getMe } from "@/api/user";
import { tokenUser } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { queryClient } from "@/api/queryClient";
import type { ApiError } from "@/types/api";

function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const apiError = error as Partial<ApiError>;
  return apiError.code === 401;
}

export function AuthBootstrap() {
  const hasStartedRef = useRef(false);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    void (async () => {
      setBootstrapping(true);
      try {
        const cachedMe = queryClient.getQueryData(["user", "me"]);
        if (cachedMe) {
          setAuthenticated(true);
          return;
        }

        try {
          const me = await getMe();
          setAuthenticated(true);
          queryClient.setQueryData(["user", "me"], me);
          return;
        } catch (error) {
          if (!isUnauthorizedError(error)) {
            logout();
            return;
          }
        }

        try {
          await tokenUser();
          const meAfterRefresh = await getMe();
          setAuthenticated(true);
          queryClient.setQueryData(["user", "me"], meAfterRefresh);
        } catch {
          logout();
        }
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [logout, setAuthenticated, setBootstrapping]);

  return null;
}
