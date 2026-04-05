import request from "supertest";
import { app } from "../../src/app.js";
import { AppError } from "../../src/middleware/errorHandler.js";
import { generateAccessToken } from "../../src/modules/auth/controller.js";
import * as authService from "../../src/modules/auth/service.js";
import * as userService from "../../src/modules/user/service.js";

type UserStub = NonNullable<Awaited<ReturnType<typeof userService.getUser>>>;

const userStub: UserStub = {
  id: "f4f9d2eb-52d9-4a89-a2e1-7f3f6f1f0f11",
  name: "Test User",
  photo_url: null,
  isVerified: true,
  role: "USER",
  created_at: new Date(),
  updated_at: new Date(),
  authMethods: [
    {
      id: "77c04f89-9a8f-4588-8568-d51f3f8d1a15",
      type: "EMAIL",
      email: "user@test.dev",
      telegram_id: null,
      google_sub: null,
    },
  ],
};

describe("Auth Integration", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 for /api/users/me without auth cookie", async () => {
    const response = await request(app).get("/api/users/me");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Missing access token");
  });

  it("returns 401 for /api/auth/token when refresh token is missing", async () => {
    const response = await request(app).post("/api/auth/token").send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Missing refresh token");
  });

  it("detects refresh reuse and revokes family", async () => {
    const revokedSession = {
      sessionId: "6478d74e-3849-4a6d-a7c6-e6cb2c815d55",
      tokenHash: "abc",
      familyId: "fam-123",
      parentSessionId: null,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      userAgent: null,
      ip: null,
      lastUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userStub.id,
    };

    const findSessionSpy = jest
      .spyOn(authService, "findSessionByTokenHash")
      .mockResolvedValue(revokedSession);
    const revokeFamilySpy = jest
      .spyOn(authService, "revokeSessionFamily")
      .mockResolvedValue();

    const response = await request(app)
      .post("/api/auth/token")
      .send({ token: "old_refresh_token" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Refresh token reuse detected");
    expect(findSessionSpy).toHaveBeenCalled();
    expect(revokeFamilySpy).toHaveBeenCalledWith("fam-123");
  });

  it("returns 400 for /api/auth/google/exchange with invalid payload", async () => {
    const response = await request(app)
      .post("/api/auth/google/exchange")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid Google exchange payload");
  });

  it("returns 409 for /api/auth/google/exchange when service reports conflict", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: "google-sub-123",
        email: "user@test.dev",
        email_verified: "true",
        aud: process.env.GOOGLE_CLIENT_ID,
      }),
    } as Response);

    jest
      .spyOn(authService, "loginWithGoogle")
      .mockRejectedValue(new AppError("Item already exists", 409));

    const response = await request(app)
      .post("/api/auth/google/exchange")
      .send({ idToken: "valid_google_id_token" });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("Item already exists");
  });

  it("creates backend session cookies on successful google exchange", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: "google-sub-123",
        email: "user@test.dev",
        email_verified: "true",
        name: "Google User",
        aud: process.env.GOOGLE_CLIENT_ID,
      }),
    } as Response);

    jest.spyOn(authService, "loginWithGoogle").mockResolvedValue(userStub);
    jest.spyOn(authService, "createSession").mockResolvedValue({
      sessionId: "e6594ef2-7a59-4f7a-99f9-862758f624b2",
      tokenHash: "hash",
      familyId: "fam-1",
      parentSessionId: null,
      expiresAt: new Date(),
      revokedAt: null,
      userAgent: null,
      ip: null,
      lastUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userStub.id,
    });

    const response = await request(app)
      .post("/api/auth/google/exchange")
      .send({ idToken: "valid_google_id_token" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ authenticated: true });
    const setCookieHeader = response.headers["set-cookie"];
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];

    expect(
      cookies.some((cookie) => cookie.includes("fintrack_access_token=")),
    ).toBe(true);
    expect(
      cookies.some((cookie) => cookie.includes("fintrack_refresh_token=")),
    ).toBe(true);
  });

  it("returns 200 for /api/users/me with valid access token cookie", async () => {
    const accessToken = generateAccessToken({
      id: userStub.id,
      email: "user@test.dev",
      telegram_id: null,
      role: "USER",
      isVerified: true,
    });

    jest.spyOn(userService, "getUser").mockResolvedValue(userStub);

    const response = await request(app)
      .get("/api/users/me")
      .set("Cookie", [`fintrack_access_token=${accessToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(userStub.id);
  });
});
