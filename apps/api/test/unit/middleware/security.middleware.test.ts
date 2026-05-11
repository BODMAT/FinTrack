import { jest } from "@jest/globals";

describe("Security middleware", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("calls next with error when no CSRF token on mutation request in production", async () => {
    jest.unstable_mockModule("../../../src/config/env.js", () => ({
      ENV: {
        NODE_ENV: "production",
        CSRF_SECRET: "test-secret-for-csrf",
      },
    }));

    const { doubleCsrfProtection } =
      await import("../../../src/middleware/csrf.js");
    const next = jest.fn();

    doubleCsrfProtection(
      {
        method: "POST",
        path: "/api/transactions",
        headers: {},
        cookies: {},
      } as never,
      { cookie: jest.fn() } as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0]?.[0] as { status?: number };
    expect(err).toBeTruthy();
    expect(err.status).toBe(403);
  });

  it("skips CSRF for Stripe webhook path", async () => {
    jest.unstable_mockModule("../../../src/config/env.js", () => ({
      ENV: {
        NODE_ENV: "production",
        CSRF_SECRET: "test-secret-for-csrf",
      },
    }));

    const { doubleCsrfProtection } =
      await import("../../../src/middleware/csrf.js");
    const next = jest.fn();

    doubleCsrfProtection(
      {
        method: "POST",
        path: "/api/donations/webhook",
        headers: {},
        cookies: {},
      } as never,
      { cookie: jest.fn() } as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("falls back to token role when DB role lookup fails", async () => {
    const findUnique = jest
      .fn<() => Promise<unknown>>()
      .mockRejectedValue(new Error("db down"));

    jest.unstable_mockModule("../../../src/config/env.js", () => ({
      ENV: {
        NODE_ENV: "production",
      },
    }));

    jest.unstable_mockModule("../../../src/prisma/client.js", () => ({
      prisma: {
        user: {
          findUnique,
        },
      },
    }));

    const { requireRole } = await import("../../../src/middleware/authz.js");
    const next = jest.fn();

    const middleware = requireRole(["ADMIN"]);

    await middleware(
      {
        user: {
          id: "user-1",
          role: "ADMIN",
          sessionId: "session-1",
          email: null,
          telegram_id: null,
          isVerified: true,
        },
      } as never,
      {} as never,
      next,
    );

    expect(findUnique).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("maps AppError into custom status and payload", async () => {
    const { AppError, errorHandler } =
      await import("../../../src/middleware/errorHandler.js");

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    errorHandler(
      new AppError("Forbidden", 403, { reason: "role" }),
      {} as never,
      res as never,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      details: { reason: "role" },
    });
  });
});
