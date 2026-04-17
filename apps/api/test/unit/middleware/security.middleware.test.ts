import { jest } from "@jest/globals";

describe("Security middleware", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("blocks unsafe request with invalid origin in production CSRF", async () => {
    jest.unstable_mockModule("../../../src/config/env.js", () => ({
      ENV: {
        NODE_ENV: "production",
      },
    }));

    const { csrfProtection } = await import("../../../src/middleware/csrf.js");
    const next = jest.fn();

    const middleware = csrfProtection(["https://app.fintrack.dev"]);

    middleware(
      {
        method: "POST",
        path: "/transactions",
        headers: { origin: "https://evil.site" },
      } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    const firstArg = next.mock.calls[0]?.[0] as {
      message?: string;
      statusCode?: number;
    };
    expect(firstArg?.message).toBe("CSRF validation failed");
    expect(firstArg?.statusCode).toBe(403);
  });

  it("allows Stripe webhook path in production CSRF middleware", async () => {
    jest.unstable_mockModule("../../../src/config/env.js", () => ({
      ENV: {
        NODE_ENV: "production",
      },
    }));

    const { csrfProtection } = await import("../../../src/middleware/csrf.js");
    const next = jest.fn();

    const middleware = csrfProtection(["https://app.fintrack.dev"]);

    middleware(
      {
        method: "POST",
        path: "/donations/webhook",
        headers: { origin: "https://evil.site" },
      } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("falls back to token role when DB role lookup fails", async () => {
    const findUnique = jest.fn().mockRejectedValue(new Error("db down"));

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
