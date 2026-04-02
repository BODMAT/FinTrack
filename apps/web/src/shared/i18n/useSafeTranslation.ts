"use client";

import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { FALLBACK_LANGUAGE } from "./config";

export function useSafeTranslation() {
  const { t, i18n } = useTranslation();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const safeT = mounted ? t : i18n.getFixedT(FALLBACK_LANGUAGE);

  return {
    t: safeT,
    i18n,
    mounted,
  };
}
