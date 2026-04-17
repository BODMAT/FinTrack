import { beforeEach, describe, expect, it, vi } from "vitest";

type ErrorHandler = (error: unknown) => Promise<unknown>;

const refreshPost = vi.fn();
const retryRequest = vi.fn();

let rejectedHandler: ErrorHandler;

const mockStoreState = {
  isAuthenticated: true,
  setAuthenticated: vi.fn(),
  logout: vi.fn(),
};

const apiInstance = Object.assign(retryRequest, {
  defaults: {
    baseURL: "https://api.fintrack.dev",
  },
  interceptors: {
    response: {
      use: vi.fn((onFulfilled, onRejected) => {
        rejectedHandler = onRejected;
        return 1;
      }),
    },
  },
});

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => apiInstance),
    post: refreshPost,
  },
}));

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: {
    getState: () => mockStoreState,
  },
}));

describe("api interceptor refresh flow", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    await import("@/api/api");
  });

  it("refreshes token and retries request on 401 for non-auth endpoint", async () => {
    refreshPost.mockResolvedValue({ status: 200 });
    retryRequest.mockResolvedValue({ data: { ok: true } });

    const originalRequest = { url: "/transactions", _retry: false };

    const result = await rejectedHandler({
      config: originalRequest,
      response: { status: 401 },
    });

    expect(refreshPost).toHaveBeenCalledWith(
      "https://api.fintrack.dev/auth/token",
      {},
      { withCredentials: true },
    );
    expect(mockStoreState.setAuthenticated).toHaveBeenCalledWith(true);
    expect(retryRequest).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ data: { ok: true } });
  });

  it("does not refresh for auth endpoints", async () => {
    const originalRequest = { url: "/auth/login", _retry: false };

    await expect(
      rejectedHandler({
        config: originalRequest,
        response: { status: 401 },
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(refreshPost).not.toHaveBeenCalled();
    expect(retryRequest).not.toHaveBeenCalled();
  });

  it("logs out when refresh fails", async () => {
    refreshPost.mockRejectedValue(new Error("refresh failed"));

    const originalRequest = { url: "/summary", _retry: false };

    await expect(
      rejectedHandler({
        config: originalRequest,
        response: { status: 401 },
      }),
    ).rejects.toThrow("refresh failed");

    expect(mockStoreState.logout).toHaveBeenCalled();
  });
});
