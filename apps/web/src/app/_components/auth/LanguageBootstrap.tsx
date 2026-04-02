"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FALLBACK_LANGUAGE,
  normalizeLanguage,
  type SupportedLanguage,
} from "@/shared/i18n/config";

const LANGUAGE_COOKIE = "i18next";
const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function getCookieLanguage(): SupportedLanguage | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${LANGUAGE_COOKIE}=`))
    ?.split("=")[1];
  return normalizeLanguage(raw ?? null);
}

function getNavigatorLanguage(): SupportedLanguage | null {
  if (typeof navigator === "undefined") return null;
  const primary = normalizeLanguage(navigator.language);
  if (primary) return primary;
  for (const language of navigator.languages ?? []) {
    const normalized = normalizeLanguage(language);
    if (normalized) return normalized;
  }
  return null;
}

function persistLanguage(language: SupportedLanguage) {
  if (typeof document === "undefined") return;
  document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=${YEAR_IN_SECONDS}; SameSite=Lax`;
  document.documentElement.lang = language;
}

export function LanguageBootstrap() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const nextLanguage =
      getCookieLanguage() ?? getNavigatorLanguage() ?? FALLBACK_LANGUAGE;

    if (i18n.resolvedLanguage !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage);
    }
    persistLanguage(nextLanguage);
  }, [i18n]);

  return null;
}
