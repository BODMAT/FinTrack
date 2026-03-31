"use client";

import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/shared/i18n/config";

const LANGUAGE_COOKIE = "i18next";
const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function setLanguageCookie(language: SupportedLanguage) {
  if (typeof document === "undefined") return;
  document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=${YEAR_IN_SECONDS}; SameSite=Lax`;
  document.documentElement.lang = language;
}

export function SwitchLanguage() {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage ?? "en").split("-")[0];

  const handleLanguageChange = (language: SupportedLanguage) => {
    setLanguageCookie(language);
    void i18n.changeLanguage(language);
  };

  return (
    <div className="mt-6 flex items-center justify-center rounded-[10px] border border-(--color-fixed-text) bg-(--color-card) p-1">
      {SUPPORTED_LANGUAGES.map((language) => {
        const active = currentLanguage === language;
        return (
          <button
            key={language}
            type="button"
            onClick={() => handleLanguageChange(language)}
            className={`min-w-10.5 rounded-lg px-2 py-1.5 text-[12px] font-bold uppercase transitioned ${
              active
                ? "bg-(--color-hover-reverse) text-(--color-text)"
                : "cursor-pointer text-(--color-fixed-text) hover:text-(--color-hover)"
            }`}
          >
            {language}
          </button>
        );
      })}
    </div>
  );
}
