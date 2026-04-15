export const SUPPORTED_LANGUAGES = ["en", "uk", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = "en";

export function normalizeLanguage(
  input?: string | null,
): SupportedLanguage | null {
  if (!input) return null;
  const normalized = input.toLowerCase().split("-")[0];
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)) {
    return normalized as SupportedLanguage;
  }
  return null;
}
