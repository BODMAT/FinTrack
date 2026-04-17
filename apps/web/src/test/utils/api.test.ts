import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { z } from "zod";
import { handleRequest } from "@/utils/api";

const { captureClientError } = vi.hoisted(() => ({
  captureClientError: vi.fn(),
}));

vi.mock("@/lib/errorCapture", () => ({
  captureClientError,
}));

describe("handleRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed payload when schema is valid", async () => {
    const payload = { ok: true };
    const result = await handleRequest(
      Promise.resolve({ data: payload } as never),
      z.object({ ok: z.boolean() }),
    );

    expect(result).toEqual(payload);
  });

  it("maps 401 login error into user-friendly message", async () => {
    const error = {
      isAxiosError: true,
      message: "Request failed",
      config: { url: "/auth/login" },
      response: {
        status: 401,
        data: {
          error: "Unauthorized",
          message: "Unauthorized",
          code: 401,
        },
      },
    };

    await expect(
      handleRequest(Promise.reject(error as never)),
    ).rejects.toMatchObject({
      code: 401,
      message: "Invalid email or password",
    });
    expect(captureClientError).not.toHaveBeenCalled();
  });

  it("maps network error to code=0", async () => {
    const error = {
      isAxiosError: true,
      message: "Network Error",
      config: { url: "/transactions" },
      response: undefined,
      code: "ERR_NETWORK",
    };

    await expect(
      handleRequest(Promise.reject(error as never)),
    ).rejects.toMatchObject({
      code: 0,
      message: "Server is unreachable. Please check your connection",
    });

    expect(captureClientError).not.toHaveBeenCalled();
  });

  it("reports 5xx errors to capture service", async () => {
    const error = {
      isAxiosError: true,
      message: "Server exploded",
      config: { url: "/transactions" },
      response: {
        status: 500,
        data: {
          error: "Internal Server Error",
          message: "Internal Server Error",
          code: 500,
        },
      },
    };

    await expect(
      handleRequest(Promise.reject(error as never)),
    ).rejects.toMatchObject({
      code: 500,
    });

    expect(captureClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "api:/transactions",
      }),
    );
  });

  it("treats non-axios errors as unexpected", async () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValue(false);

    await expect(
      handleRequest(Promise.reject(new Error("boom"))),
    ).rejects.toMatchObject({
      code: 500,
      error: "boom",
    });

    expect(captureClientError).toHaveBeenCalledWith(
      expect.objectContaining({ source: "api:unexpected" }),
    );
  });
});
