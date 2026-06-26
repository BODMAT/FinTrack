const PROCESSED_GOOGLE_ID_TOKEN_KEY = "fintrack.oauth.processedGoogleIdToken";
const GOOGLE_LINK_INTENT_KEY = "fintrack.oauth.googleLinkIntent";

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

// Marks that the next Google OAuth round-trip is a "link to current account"
// action (from the account popup), not a login. Survives the OAuth redirect.
export function setGoogleLinkIntent() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(GOOGLE_LINK_INTENT_KEY, "1");
}

export function getGoogleLinkIntent(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(GOOGLE_LINK_INTENT_KEY) === "1";
}

export function clearGoogleLinkIntent() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(GOOGLE_LINK_INTENT_KEY);
}
