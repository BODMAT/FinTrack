import { jest } from "@jest/globals";
import request from "supertest";

import type { app as AppType } from "../../src/app.js";
import type * as UserServiceTypes from "../../src/modules/user/service.js";
import type * as AuthServiceTypes from "../../src/modules/auth/service.js";
import type { AppError as AppErrorType } from "../../src/middleware/errorHandler.js";
import type { generateAccessToken as GenerateAccessTokenType } from "../../src/modules/auth/controller.js";

jest.unstable_mockModule("../../src/modules/auth/service.js", () => ({
  findSessionById: jest.fn(),
  findSessionByTokenHash: jest.fn(),
  revokeSessionFamily: jest.fn(),
  loginWithGoogle: jest.fn(),
  createSession: jest.fn(),
}));

jest.unstable_mockModule("../../src/modules/user/service.js", () => ({
  getUser: jest.fn(),
  deleteAuthMethod: jest.fn(),
}));

let app: typeof AppType;
let authService: typeof AuthServiceTypes;
let userService: typeof UserServiceTypes;
let generateAccessToken: typeof GenerateAccessTokenType;
let AppError: typeof AppErrorType;

beforeAll(async () => {
  ({ app } = await import("../../src/app.js"));
  authService = await import("../../src/modules/auth/service.js");
  userService = await import("../../src/modules/user/service.js");
  ({ generateAccessToken } =
    await import("../../src/modules/auth/controller.js"));
  ({ AppError } = await import("../../src/middleware/errorHandler.js"));
});

describe("User Integration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("uses current user id from token for deleting auth method (/me path)", async () => {
    const currentUserId = "66ba6cb3-3a2d-4fd9-8a61-30f5ad4fd897";
    const authMethodId = "5c8dff72-a6f7-4293-af7a-7c7f6190c020";

    const accessToken = generateAccessToken({
      id: currentUserId,
      email: "me@test.dev",
      telegram_id: null,
      role: "USER",
      isVerified: true,
      sessionId: "5c8dff72-a6f7-4293-af7a-7c7f6190c020",
    });

    jest.mocked(authService.findSessionById).mockResolvedValue({
      sessionId: "5c8dff72-a6f7-4293-af7a-7c7f6190c020",
      userId: currentUserId,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    jest.mocked(userService.deleteAuthMethod).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/users/me/auth-methods/${authMethodId}`)
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(204);
    expect(userService.deleteAuthMethod).toHaveBeenCalledWith(
      currentUserId,
      authMethodId,
    );
  });

  it("returns 404 for /api/users/me/auth-methods/:id when service does not find method", async () => {
    const currentUserId = "5b0e88d2-5a89-4b11-96ab-8936d5117aa6";
    const authMethodId = "97552032-a5b4-4be3-90f8-b2e9f22ab44f";

    const accessToken = generateAccessToken({
      id: currentUserId,
      email: "me@test.dev",
      telegram_id: null,
      role: "USER",
      isVerified: true,
      sessionId: "97552032-a5b4-4be3-90f8-b2e9f22ab44f",
    });

    jest.mocked(authService.findSessionById).mockResolvedValue({
      sessionId: "97552032-a5b4-4be3-90f8-b2e9f22ab44f",
      userId: currentUserId,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    jest
      .mocked(userService.deleteAuthMethod)
      .mockRejectedValue(new AppError("Auth method not found", 404));

    const response = await request(app)
      .delete(`/api/users/me/auth-methods/${authMethodId}`)
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Auth method not found");
  });
});
