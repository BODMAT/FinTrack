const PROCESSED_GOOGLE_ID_TOKEN_KEY = "fintrack.oauth.processedGoogleIdToken";

function canUseSessionStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

export function getProcessedGoogleIdToken(): string | null {
  if (!canUseSessionStorage()) return null;
  return window.sessionStorage.getItem(PROCESSED_GOOGLE_ID_TOKEN_KEY);
}

export function setProcessedGoogleIdToken(idToken: string) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(PROCESSED_GOOGLE_ID_TOKEN_KEY, idToken);
}

export function clearProcessedGoogleIdToken() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PROCESSED_GOOGLE_ID_TOKEN_KEY);
}
