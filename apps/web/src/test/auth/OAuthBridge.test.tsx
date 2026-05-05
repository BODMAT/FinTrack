import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { OAuthBridge } from "@/app/_components/auth/OAuthBridge";

const { exchangeGoogleSession, invalidateQueries, signOut } = vi.hoisted(
  () => ({
    exchangeGoogleSession: vi.fn(),
    invalidateQueries: vi.fn(),
    signOut: vi.fn(),
  }),
);

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

vi.mock("@/lib/oauthBridge", () => ({
  getProcessedGoogleIdToken: vi.fn(() => null),
  setProcessedGoogleIdToken: vi.fn(),
  clearProcessedGoogleIdToken: vi.fn(),
}));

// TODO: Re-enable after stabilizing React module resolution in Vitest workspace setup.
describe.skip("OAuthBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStatus = "unauthenticated";
    sessionData = null;
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
});
