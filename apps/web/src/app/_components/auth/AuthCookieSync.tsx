"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const AUTH_COOKIE_NAME = "fintrack_auth";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function setAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function AuthCookieSync() {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      setAuthCookie();
      return;
    }

    clearAuthCookie();
  }, [token]);

  return null;
}
