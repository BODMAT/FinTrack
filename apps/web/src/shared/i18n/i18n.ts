import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from "./config";

import en from "./locales/en/translation.json";
import uk from "./locales/uk/translation.json";
import ru from "./locales/ru/translation.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      uk: { translation: uk },
      ru: { translation: ru },
    },
    lng: FALLBACK_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
