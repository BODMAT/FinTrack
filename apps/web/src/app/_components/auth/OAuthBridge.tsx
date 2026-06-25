"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { exchangeGoogleSession, linkGoogleAccount } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoogleLinkStore } from "@/store/useGoogleLinkStore";
import { usePopupStore } from "@/store/popup";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { queryClient } from "@/api/queryClient";
import { AccountPopup } from "../header/AccountPopup";
import {
  clearProcessedGoogleIdToken,
  getProcessedGoogleIdToken,
  setProcessedGoogleIdToken,
  getGoogleLinkIntent,
  clearGoogleLinkIntent,
} from "@/lib/oauthBridge";

export function OAuthBridge() {
  const { t } = useSafeTranslation();
  const { data: session, status } = useSession();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);
  const lastProcessedIdTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const idToken = session?.googleIdToken;
    if (!idToken) return;
    if (lastProcessedIdTokenRef.current === idToken) return;
    if (getProcessedGoogleIdToken() === idToken) return;

    lastProcessedIdTokenRef.current = idToken;

    void (async () => {
      const isLink = getGoogleLinkIntent();
      setBootstrapping(true);
      try {
        if (isLink) {
          // Link the Google account to the currently logged-in user.
          await linkGoogleAccount(idToken);
          clearGoogleLinkIntent();
          setProcessedGoogleIdToken(idToken);
          await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
          useGoogleLinkStore.getState().setNotice({ ok: true });
          usePopupStore
            .getState()
            .open(t("auth.manageAccount"), <AccountPopup />);
        } else {
          await exchangeGoogleSession(idToken);
          setProcessedGoogleIdToken(idToken);
          setAuthenticated(true);
          await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
        }
      } catch (err) {
        if (isLink) {
          // Linking failed (e.g. email mismatch) — keep the user signed in
          // and surface the reason in the account popup.
          clearGoogleLinkIntent();
          setProcessedGoogleIdToken(idToken);
          useGoogleLinkStore.getState().setNotice({
            ok: false,
            message: err instanceof Error ? err.message : undefined,
          });
          usePopupStore
            .getState()
            .open(t("auth.manageAccount"), <AccountPopup />);
        } else {
          clearProcessedGoogleIdToken();
          await signOut({ redirect: false });
        }
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [session?.googleIdToken, setAuthenticated, setBootstrapping, status, t]);

  return null;
}
