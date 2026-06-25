import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { OAuthBridge } from "@/app/_components/auth/OAuthBridge";

const {
  exchangeGoogleSession,
  linkGoogleAccount,
  invalidateQueries,
  signOut,
  getGoogleLinkIntent,
  clearGoogleLinkIntent,
  setNotice,
  popupOpen,
} = vi.hoisted(() => ({
  exchangeGoogleSession: vi.fn(),
  linkGoogleAccount: vi.fn(),
  invalidateQueries: vi.fn(),
  signOut: vi.fn(),
  getGoogleLinkIntent: vi.fn(() => false),
  clearGoogleLinkIntent: vi.fn(),
  setNotice: vi.fn(),
  popupOpen: vi.fn(),
}));

let sessionStatus: "authenticated" | "loading" | "unauthenticated" =
  "unauthenticated";
let sessionData: { googleIdToken?: string } | null = null;

const authStoreState = {
  setAuthenticated: vi.fn(),
  setBootstrapping: vi.fn(),
};

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: sessionData, status: sessionStatus }),
  signOut,
}));

vi.mock("@/api/auth", () => ({
  exchangeGoogleSession,
  linkGoogleAccount,
}));

vi.mock("@/api/queryClient", () => ({
  queryClient: {
    invalidateQueries,
  },
}));

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: (state: typeof authStoreState) => unknown) =>
    selector(authStoreState),
}));

vi.mock("@/store/useGoogleLinkStore", () => ({
  useGoogleLinkStore: { getState: () => ({ setNotice }) },
}));

vi.mock("@/store/popup", () => ({
  usePopupStore: { getState: () => ({ open: popupOpen }) },
}));

vi.mock("@/shared/i18n/useSafeTranslation", () => ({
  useSafeTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/app/_components/header/AccountPopup", () => ({
  AccountPopup: () => null,
}));

vi.mock("@/lib/oauthBridge", () => ({
  getProcessedGoogleIdToken: vi.fn(() => null),
  setProcessedGoogleIdToken: vi.fn(),
  clearProcessedGoogleIdToken: vi.fn(),
  getGoogleLinkIntent,
  clearGoogleLinkIntent,
}));

describe("OAuthBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStatus = "unauthenticated";
    sessionData = null;
    getGoogleLinkIntent.mockReturnValue(false);
  });

  it("exchanges google token and sets auth state", async () => {
    sessionStatus = "authenticated";
    sessionData = { googleIdToken: "google-token-1" };
    exchangeGoogleSession.mockResolvedValue(undefined);

    render(<OAuthBridge />);

    await waitFor(() => {
      expect(exchangeGoogleSession).toHaveBeenCalledWith("google-token-1");
    });

    expect(authStoreState.setBootstrapping).toHaveBeenCalledWith(true);
    expect(authStoreState.setAuthenticated).toHaveBeenCalledWith(true);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["user", "me"],
    });
    expect(authStoreState.setBootstrapping).toHaveBeenLastCalledWith(false);
  });

  it("signs out when exchange fails", async () => {
    sessionStatus = "authenticated";
    sessionData = { googleIdToken: "google-token-2" };
    exchangeGoogleSession.mockRejectedValue(new Error("exchange failed"));

    render(<OAuthBridge />);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ redirect: false });
    });

    expect(authStoreState.setAuthenticated).not.toHaveBeenCalledWith(true);
    expect(authStoreState.setBootstrapping).toHaveBeenLastCalledWith(false);
  });

  it("links the google account when link intent is set", async () => {
    sessionStatus = "authenticated";
    sessionData = { googleIdToken: "google-token-3" };
    getGoogleLinkIntent.mockReturnValue(true);
    linkGoogleAccount.mockResolvedValue(undefined);

    render(<OAuthBridge />);

    await waitFor(() => {
      expect(linkGoogleAccount).toHaveBeenCalledWith("google-token-3");
    });

    expect(exchangeGoogleSession).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(setNotice).toHaveBeenCalledWith({ ok: true });
    expect(popupOpen).toHaveBeenCalled();
    expect(authStoreState.setAuthenticated).not.toHaveBeenCalledWith(true);
  });

  it("surfaces a failure notice without signing out when linking fails", async () => {
    sessionStatus = "authenticated";
    sessionData = { googleIdToken: "google-token-4" };
    getGoogleLinkIntent.mockReturnValue(true);
    linkGoogleAccount.mockRejectedValue(new Error("email mismatch"));

    render(<OAuthBridge />);

    await waitFor(() => {
      expect(setNotice).toHaveBeenCalledWith({
        ok: false,
        message: "email mismatch",
      });
    });

    expect(signOut).not.toHaveBeenCalled();
    expect(popupOpen).toHaveBeenCalled();
    expect(authStoreState.setBootstrapping).toHaveBeenLastCalledWith(false);
  });
});
